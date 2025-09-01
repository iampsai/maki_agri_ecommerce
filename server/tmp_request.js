const http=require('http');
const options={hostname:'127.0.0.1',port:8080,path:'/api/chat/admin/messages',method:'GET',timeout:5000};
const req=http.request(options,res=>{let d='';console.log('STATUS',res.statusCode);res.on('data',c=>d+=c);res.on('end',()=>console.log('BODY',d));});
req.on('error',e=>console.error('ERR',e));req.end();
