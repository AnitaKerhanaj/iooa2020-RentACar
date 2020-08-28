if(process.env.NODE_ENV==='production'){
    module.exports=require('./prod');
}else{ //lokalno
    module.exports=require('./dev');
}