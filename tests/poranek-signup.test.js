const test = require('node:test');
const assert = require('node:assert/strict');
const { createHandler } = require('../api/_poranek-signup');
function response() { return { headers: {}, setHeader(k,v) { this.headers[k]=v; }, status(n) { this.code=n;return this; }, json(v) { this.body=v;return this; } }; }
function request(body = {}, origin = 'https://ai-team.pl') { return { method:'POST',headers:{origin},body:{email:'person@example.com',consent:true,...body} }; }
function harness() {
  const docs = new Map(); let calls=0;
  const handler=createHandler({getServerFirestoreToken:async()=>{calls++;return 'test-token';},getDoc:async p=>docs.get(p),setDoc:async(p,d)=>docs.set(p,d),now:()=> '2026-09-18T14:00:00.000Z'});
  return {handler,docs,calls:()=>calls};
}
test('zapis i powtórka: jeden rekord wydarzenia, zero zgody newsletterowej',async()=>{
 const h=harness();const r=response();await h.handler(request({email:' PERSON@EXAMPLE.COM '}),r);assert.equal(r.code,200);assert.equal(r.body.ok,true);assert.equal(h.docs.size,1);
 const [path,doc]=[...h.docs][0];assert.match(path,/^zlecenia\/poranek_[a-f0-9]{64}$/);assert.equal(doc.email,'person@example.com');assert.equal(doc.consent.newsletter,false);assert.equal(doc.consent.event_notification,true);assert.equal(doc.source,'poranek-ai');
 await h.handler(request(),response());assert.equal(h.docs.size,1);assert.equal([...h.docs.values()][0],doc);
});
test('brak zgody, niepoprawny email i obca domena nie dotykają bazy',async()=>{
 const h=harness();for(const [req,status] of [[request({consent:false}),400],[request({email:'<script>@example.com'}),400],[request({},'https://example.com'),403]]){const r=response();await h.handler(req,r);assert.equal(r.code,status);}assert.equal(h.calls(),0);assert.equal(h.docs.size,0);
});
test('honeypot nie zapisuje, za duży formularz jest odrzucany',async()=>{
 const h=harness();let r=response();await h.handler(request({website:'spam'}),r);assert.equal(r.body.ok,true);r=response();await h.handler(request({extra:'x'.repeat(4000)}),r);assert.equal(r.code,413);assert.equal(h.calls(),0);
});
test('awaria storage nie może pokazać sukcesu ani szczegółów serwera',async()=>{
 const h=createHandler({getServerFirestoreToken:async()=> 'token',getDoc:async()=>null,setDoc:async()=>{throw new Error('private details');}});const r=response();await h(request(),r);assert.equal(r.code,503);assert.equal(r.body.ok,false);assert.doesNotMatch(JSON.stringify(r.body),/private details/);
});
