export function socketMessage(io) {
    io.on('connection',(soket)=>{
        soket.on('message',function(message){
            soket.broadcast.emit('message',message)
        })
      })
}


