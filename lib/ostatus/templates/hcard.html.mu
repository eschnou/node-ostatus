<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"> 
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en"> 
 	<head> 
 	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  	<title>HCard - {{username}}</title>
	</head> 
	<body id="hcard"> 
		<div id="wrapper"> 
			<div id="i" class="entity_profile vcard author"> 
		       <h2>User profile</h2> 
		       <dl class="entity_depiction"> 
		        <dt>Photo</dt> 
		        <dd> 
		        	<img src="{{avatar}}" class="photo avatar" width="96" height="96" alt="{{username}}"/> 
				</dd> 
			   </dl>
		       <dl class="entity_nickname"> 
		        <dt>Nickname</dt> 
		        <dd> 
		         <a href="{{profile}}" rel="me" class="nickname url uid">{{username}}</a> 
				</dd> 
			   </dl> 
		       <dl class="entity_fn"> 
		        <dt>Full name</dt> 
		        <dd> 
		         <span class="fn">{{fullname}}</span> 
		        </dd> 
			   </dl> 
		       <dl class="entity_location"> 
		        <dt>Location</dt> 
		        <dd class="label">{{location}}</dd> 
		       </dl> 
		       <dl class="entity_note"> 
		        <dt>Note</dt> 
		        <dd class="note">{{note}}</dd> 
			   </dl> 
		  	</div> 
   		</div> 
	</body>
</html> 
 
 
