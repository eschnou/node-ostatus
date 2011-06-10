#include <node.h>
#include <node_buffer.h>
#include <openssl/evp.h>
#include <openssl/pem.h>
#include <cstring>

using namespace v8;
using namespace node;

// http://sambro.is-super-awesome.com/2011/03/03/creating-a-proper-buffer-in-a-node-c-addon/
static Handle<Value> makeBuffer(unsigned char *data, int length) {
  HandleScope scope;

  Buffer *slowBuffer = Buffer::New(length);
  memcpy(Buffer::Data(slowBuffer), data, length);
  Local<Object> globalObj = Context::GetCurrent()->Global();
  Local<Function> bufferConstructor = Local<Function>::Cast(globalObj->Get(String::New("Buffer")));
  Handle<Value> constructorArgs[3] = { slowBuffer->handle_, Integer::New(length), Integer::New(0) };
  Local<Object> actualBuffer = bufferConstructor->NewInstance(3, constructorArgs);

  return scope.Close(actualBuffer);
}

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
    result = makeBuffer(data, len);
  } else {
    result = Null();
  }
  delete[] data;

  return result;
}

static BIGNUM *binaryToBn(Handle<Value> &bin) {
  BIGNUM *result = NULL;

  if (Buffer::HasInstance(bin)) {
    /* Copy only once for Buffer */
    Local<Object> buf = bin->ToObject();
    result = BN_bin2bn((unsigned char *)Buffer::Data(buf), Buffer::Length(buf), NULL);

  } else {
    ssize_t len = DecodeBytes(bin);
    if (len >= 0) {
      unsigned char *buf = new unsigned char[len];
      len = DecodeWrite((char *)buf, len, bin);
      result = BN_bin2bn(buf, len, NULL);
      delete[] buf;
    }
  }

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
  int status = RSA_generate_key_ex(rsa, 1024, bn_e, NULL);
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
 * Do not forget freeing result BIO
 * @param k Modulus (n) byte count
 */
static BIO *EMSA_PKCS1_v1_5(Handle<Object> m, int k) {
  const int hashLen = 256 / 8;
  const int prefixLen = 19;

  BIO *result = BIO_new(BIO_s_mem());
  BIO_write(result, "\x00\x01", 2);

  /* padding */
  for(int i = 0; i < k - (prefixLen + hashLen); i++)
    BIO_write(result, "\xFF", 1);
  BIO_write(result, "\x00", 1);

  const char prefix[] = { 0x30, 0x31, 0x30, 0xd, 0x6, 0x9, 0x60, 0x86,
                          0x48, 0x1, 0x65, 0x3, 0x4, 0x2, 0x1, 0x5,
                          0x0, 0x4, 0x20 };
  BIO_write(result, prefix, prefixLen);

  ssize_t mLen = DecodeBytes(m);
  unsigned char *mBuf = new unsigned char[mLen];
  printf("hashing %i bytes from %X\n", mLen, mBuf);
  unsigned char mDigest[hashLen];
  SHA256(mBuf, mLen, mDigest);
  delete[] mBuf;
  BIO_write(result, mDigest, hashLen);

  return result;
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
  Handle<Object> m = args[0]->ToObject();
  Handle<Value> privKey = args[1];

  /* Prepare key */
  BIO *bp = binaryToBIO(privKey);
  if (!bp) {
    Local<Value> exception = Exception::Error(String::New("BIO error"));
    return ThrowException(exception);
  }

  EVP_PKEY *pkey = PEM_read_bio_PrivateKey(bp, NULL, NULL, NULL);
  if (!pkey || EVP_PKEY_type(pkey->type) != EVP_PKEY_RSA) {
    Local<Value> exception = Exception::Error(String::New("Cannot read key"));
    return ThrowException(exception);
  }
  BIO_free(bp);
  RSA *rsa = EVP_PKEY_get1_RSA(pkey);

  /* signing */
  BIO *emsa = EMSA_PKCS1_v1_5(m, BN_num_bytes(rsa->n));
  unsigned char *emsaData;
  long emsaLen = BIO_get_mem_data(emsa, &emsaData);

  int sigLen = RSA_size(rsa);
  unsigned char sig[sigLen];
  RSA_private_encrypt(emsaLen, emsaData, sig, rsa, RSA_NO_PADDING);

  BIO_free(emsa);
  EVP_PKEY_free(pkey);

  /*printf("sig:");
  for(int i=0; i < sigLen;i++)
    printf(" %02X",sig[i]);
    printf("\n");*/
  Handle<Value> sigResult = makeBuffer(sig, sigLen);


  return scope.Close(sigResult);
}

/**
 * @param Message
 * @param Signature to verify
 * @param Public key { n: Buffer, e: Buffer }
 */
static Handle<Value> VerifyRSASHA256(const Arguments &args) {
  HandleScope scope;

  if (args.Length() != 3) {
      Local<Value> exception = Exception::TypeError(String::New("Bad argument"));
      return ThrowException(exception);
  }
  Handle<Object> m = args[0]->ToObject();
  Handle<Object> sig = args[1]->ToObject();
  Handle<Object> pubKey = args[2]->ToObject();

  /* Prepare key */
  RSA *rsa = RSA_new();
  Handle<Value> n = pubKey->Get(String::NewSymbol("n"));
  rsa->n = binaryToBn(n);
  Handle<Value> e = pubKey->Get(String::NewSymbol("e"));
  rsa->e = binaryToBn(e);

  /* Prepare data */
  BIO *emsa = EMSA_PKCS1_v1_5(m, BN_num_bytes(rsa->n));
  unsigned char *emsaData;
  long emsaLen = BIO_get_mem_data(emsa, &emsaData);

  int rsigLen = RSA_size(rsa);
  unsigned char rsigBuf[rsigLen];
  RSA_public_decrypt(emsaLen, emsaData, rsigBuf, rsa, RSA_NO_PADDING);

  BIO_free(emsa);
  RSA_free(rsa);

  /* Pass sig */
  int sigLen = Buffer::Length(sig);
  unsigned char *sigBuf = (unsigned char *)Buffer::Data(sig);

  printf("rsig(%i):", rsigLen);
  for(int i=0; i < rsigLen;i++)
    printf(" %02X",rsigBuf[i]);
  printf("\n");
  printf("sig(%i):", sigLen);
  for(int i=0; i < sigLen;i++)
    printf(" %02X",sigBuf[i]);
  printf("\n");

  int status = rsigLen == sigLen;
  for(int i = 0; status && i < rsigLen; i++) {
    if (sigBuf[i] != rsigBuf[i])
      printf("%X != %X\n", sigBuf[i], rsigBuf[i]);
    status &= sigBuf[i] == rsigBuf[i];
  }

  switch(status) {
  case 1:
    return scope.Close(True());
    break;
  case 0:
    return scope.Close(False());
    break;
  default:
    Local<Value> exception = Exception::Error(String::New("Verification error"));
    return ThrowException(exception);
  }
}

extern "C" void
init (Handle<Object> target) 
{
  HandleScope scope;

  OpenSSL_add_all_digests();
  OpenSSL_add_all_algorithms();

  NODE_SET_METHOD(target, "generate", Generate);
  NODE_SET_METHOD(target, "signRSASHA256", SignRSASHA256);
  NODE_SET_METHOD(target, "verifyRSASHA256", VerifyRSASHA256);
}
