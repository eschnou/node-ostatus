#include <node.h>
#include <node_buffer.h>
#include <openssl/evp.h>
#include <openssl/pem.h>

using namespace v8;
using namespace node;

/**
 * Do not forget to call BIO_free() after use
 */
static BIO *binaryToBIO(Handle<Value> &bin) {
  BIO *bp = BIO_new(BIO_s_mem());
  if (!bp)
    return NULL;

  if (Buffer::HasInstance(bin)) {
    /* Copy only once for Buffer */
    Local<Object> buf = bin->ToObject();
    BIO_write(bp, Buffer::Data(buf), Buffer::Length(buf));

  } else {
    ssize_t len = DecodeBytes(bin);
    if (len >= 0) {
      char *buf = new char[len];
      len = DecodeWrite(buf, len, bin);
      // TODO: assert !res
      BIO_write(bp, buf, len);
      delete[] buf;
    } else {
      BIO_free(bp);
      return NULL;
    }
  }

  return bp;
}

Handle<Value> BIOToBinary(BIO *bp) {
  char *data;
  long len = BIO_get_mem_data(bp, &data);
  return Encode(data, len);
}

static Handle<Value> bnToBinary(BIGNUM *bn) {
  if (!bn) return Null();
  Handle<Value> result;

  unsigned char *data = new unsigned char[BN_num_bytes(bn)];
  int len = BN_bn2bin(bn, data);
  if (len > 0) {
    result = Encode(data, len);
  } else {
    result = Null();
  }
  delete[] data;

  return result;
}

static BIGNUM *binaryToBn(Handle<Value> &bin) {
  ssize_t len = DecodeBytes(bin);
  unsigned char *buf = new unsigned char[len];
  BIGNUM *result = BN_bin2bn(buf, len, NULL);
  delete[] buf;
  return result;
}

/**
 * Generate
 * @return { public: { n: Buffer, e: Buffer }, private: Buffer }
 */
static Handle<Value> Generate(const Arguments &args) {
  HandleScope scope;

  /* Generate */
  BIGNUM *bn_e = NULL;
  BN_hex2bn(&bn_e, "10001");

  RSA *rsa = RSA_new(); 
  int status = RSA_generate_key_ex(rsa, 2048, bn_e, NULL);
  BN_free(bn_e);
  if (!status) {
      Local<Value> exception = Exception::Error(String::New("Cannot generate"));
      return ThrowException(exception);
  }

  /* Serialize publicKey */
  Handle<Object> publicKey = Object::New();
  publicKey->Set(String::NewSymbol("n"), bnToBinary(rsa->n));
  publicKey->Set(String::NewSymbol("e"), bnToBinary(rsa->e));

  /* Serialize privateKey */
  Handle<Value> privateKey = Null();
  BIO *bp = BIO_new(BIO_s_mem());
  if (PEM_write_bio_RSAPrivateKey(bp, rsa, NULL, NULL, 0, NULL, NULL)) {
    privateKey = BIOToBinary(bp);
  }
  BIO_free(bp);
  RSA_free(rsa);


  Handle<Object> result = Object::New();
  result->Set(String::New("public"), publicKey);
  result->Set(String::New("private"), privateKey);
  return scope.Close(result);
}

/**
 * @param {String or Buffer} Message
 * @param {String or Buffer} Private key in RSAPrivateKey format
 */
static Handle<Value> SignRSASHA256(const Arguments &args) {
  HandleScope scope;

  if (args.Length() != 2) {
      Local<Value> exception = Exception::TypeError(String::New("Bad argument"));
      return ThrowException(exception);
  }
  Handle<Value> m = args[0];
  Handle<Value> privKey = args[1];

  /* Prepare key */
  BIO *bp = binaryToBIO(privKey);
  if (!bp) {
    Local<Value> exception = Exception::Error(String::New("BIO error"));
    return ThrowException(exception);
  }

  EVP_PKEY *pkey = PEM_read_bio_PrivateKey(bp, NULL, NULL, NULL);
  if (!pkey) {
    Local<Value> exception = Exception::Error(String::New("Cannot read key"));
    return ThrowException(exception);
  }

  BIO_free(bp);

  /* signing */
  const EVP_MD *md;
  md = EVP_get_digestbyname("RSA-SHA256");
  if (!md) {
    EVP_PKEY_free(pkey);

    Local<Value> exception = Exception::Error(String::New("No RSA-SHA256 message digest"));
    return ThrowException(exception);
  }

  EVP_MD_CTX mdctx;
  EVP_MD_CTX_init(&mdctx);
  EVP_SignInit_ex(&mdctx, md, NULL);

  /* TODO: for buffers, this could be zero-copy */
  ssize_t mLen = DecodeBytes(m);
  char *mBuf = new char[mLen];
  mLen = DecodeWrite(mBuf, mLen, m);
  EVP_SignUpdate(&mdctx, mBuf, mLen);
  delete[] mBuf;

  unsigned char *sig = new unsigned char[EVP_PKEY_size(pkey)];
  unsigned int sigLen;
  if (!EVP_SignFinal(&mdctx, sig, &sigLen, pkey)) {
    EVP_PKEY_free(pkey);
    delete[] sig;
    EVP_MD_CTX_cleanup(&mdctx);

    Local<Value> exception = Exception::Error(String::New("Cannot sign"));
    return ThrowException(exception);
  }
  Local<Value> sigResult = Encode(sig, sigLen);

  EVP_PKEY_free(pkey);
  delete[] sig;
  EVP_MD_CTX_cleanup(&mdctx);

  return scope.Close(sigResult);
}

extern "C" void
init (Handle<Object> target) 
{
  HandleScope scope;

  OpenSSL_add_all_digests();
  OpenSSL_add_all_algorithms();

  NODE_SET_METHOD(target, "signRSASHA256", SignRSASHA256);
  NODE_SET_METHOD(target, "generate", Generate);
}
