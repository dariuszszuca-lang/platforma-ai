const test = require('node:test');
const assert = require('node:assert/strict');
const { createHandler } = require('../api/_poranek-signup');
function response() { return { headers: {}, setHeader(k,v) { this.headers[k]=v; }, status(n) { this.code=n;return this; }, json(v) { this.body=v;return this; } }; }
function request(body = {}, origin = 'https://ai-team.pl') { return { method:'POST',headers:{origin},body:{email:'person@example.com',consent:true,...body} }; }
function harness(overrides = {}) {
  const docs = new Map(); const mails=[]; let calls=0;
  const handler=createHandler({getServerFirestoreToken:async()=>{calls++;return 'test-token';},getDoc:async p=>docs.get(p),setDoc:async(p,d)=>docs.set(p,{...docs.get(p),...d}),createDoc:async(p,d)=>{if(docs.has(p))return false;docs.set(p,d);return true;},notifyOwner:async d=>{mails.push(d);return {MessageId:'ses-test'};},now:()=> '2026-09-18T14:00:00.000Z',...overrides});
  return {handler,docs,mails,calls:()=>calls};
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
 const h=createHandler({getServerFirestoreToken:async()=> 'token',getDoc:async()=>null,createDoc:async()=>{throw new Error('private details');}});const r=response();await h(request(),r);assert.equal(r.code,503);assert.equal(r.body.ok,false);assert.doesNotMatch(JSON.stringify(r.body),/private details/);
});

test('nowy zapis wysyła jedno powiadomienie właścicielowi, powtórka nie wysyła',async()=>{
 const h=harness();await h.handler(request(),response());await h.handler(request(),response());assert.equal(h.mails.length,1);assert.equal(h.mails[0].email,'person@example.com');const d=[...h.docs.values()][0];assert.equal(d.owner_notification.status,'sent');assert.equal(d.owner_notification.message_id,'ses-test');
});
test('równoczesne zapisy tego samego adresu wysyłają jeden mail',async()=>{
 const h=harness();await Promise.all([h.handler(request(),response()),h.handler(request(),response())]);assert.equal(h.docs.size,1);assert.equal(h.mails.length,1);
});
test('awaria poczty nie gubi zapisu; status błędu jest zapisany bez sekretów',async()=>{
 const h=harness({notifyOwner:async()=>{throw Error('secret transport details');}});const r=response();await h.handler(request(),r);assert.equal(r.code,200);assert.equal(h.docs.size,1);assert.equal([...h.docs.values()][0].owner_notification.status,'failed');assert.doesNotMatch(JSON.stringify([...h.docs.values()]),/secret transport/);
});
test('powiadomienie kierowane wyłącznie do właściciela i bez listy newslettera',async()=>{
 const lib=require('../api/newsletter-send');const oldSend=lib.sendSesEmail,oldConfig=lib.getAwsConfig;let mail;
 try {lib.getAwsConfig=()=>({});lib.sendSesEmail=async input=>{mail=input;return {MessageId:'id'};};await require('../api/_poranek-signup').notifyOwner({email:'person@example.com',created_at:'2026-09-18'});assert.equal(mail.to,'dariusz.szuca@gmail.com');assert.equal(mail.subject,'Poranki z AI — nowy zapis');assert.match(mail.text,/person@example.com/);assert.match(mail.text,/https:\/\/ai-team.pl\/panel/);assert.equal(mail.contactListName,undefined);}
 finally{lib.sendSesEmail=oldSend;lib.getAwsConfig=oldConfig;}
});
test('Firestore atomowo tworzy nowy rekord i rozpoznaje konflikt bez nadpisania',async()=>{
 const previous=global.fetch;let captured;try{global.fetch=async(url,opts)=>{captured={url:String(url),opts};return {ok:true,json:async()=>({})};};const {createDoc}=require('../api/_async-firestore');assert.equal(await createDoc('zlecenia/test',{email:'person@example.com'},'test-token'),true);assert.match(captured.url,/currentDocument.exists=false/);assert.equal(captured.opts.method,'PATCH');global.fetch=async()=>({ok:false,status:409,json:async()=>({error:{message:'conflict'}})});assert.equal(await createDoc('zlecenia/test',{},'test-token'),false);}
 finally{global.fetch=previous;}
});
