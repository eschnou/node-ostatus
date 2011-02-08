<?xml version='1.0' encoding='UTF-8'?>
<XRD xmlns='http://docs.oasis-open.org/ns/xri/xrd-1.0'>
    <Subject>{{subject}}</Subject>
    <Alias>{{alias}}</Alias>
    {{#links}}
    <Link {{#rel}}rel='{{rel}}'{{/rel}} {{#href}}href='{{href}}'{{/href}} {{#ref}}ref='{{ref}}'{{/ref}} {{#type}}type='{{type}}'{{/type}}/>
    {{/links}}
</XRD>