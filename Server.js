var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

var uname;
var numOfUsers = 0;
var username = [];

var mySocketId;

var gameState = [];

var currentGameState = {
activePlayer: 1,

playerOnePosition: 0,
playerOneHp: 100,
playerOneMaxPower: 5,
playerOneCurrentPower: 5,
PlayerOneAmmo: 6,
PlayerOxygen: 100,
PlayerOneLocationTileCode: 0,

playerTwoPosition: 0,
playerTwoHp: 100,
playerTwoMaxPower: 5,
playerTwoCurrentPower: 5,
PlayerTwoAmmo: 6,
PlayerTwoOxygen: 100,
PlayerTwoOneLocationTileCode: 0,

playerOneTakeDamage: false,
playerTwoTakeDamage: false,

}

var roomno = 1;

var firstPlayerStartPos;
var secondPlayerStartPos;



//Username
// Loading the index file . html displayed to the client
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/Subhunt.html');
});

io.on('connection', (socket) => {

  //Increase roomno 2 clients are present in a room.
     if(io.nsps['/'].adapter.rooms["room-"+roomno] && io.nsps['/'].adapter.rooms["room-"+roomno].length > 1) {
       roomno++;
     }
     socket.join("room-"+roomno);

     //Send this event to everyone in the room.
     io.sockets.in("room-"+roomno).emit('connectToRoom', roomno);



  numOfUsers++
  console.log('a new user connected - ' + numOfUsers + ' total users');

  // As soon as the username is received, it's stored as a session variable
  socket.on('little_newbie', function(uname) {
      socket.uname = uname;
      username[0] = uname;
      io.emit('uname' , uname);

      if (isEven(numOfUsers)) {
        io.emit('opponentFound')
      } else {};

      //send whether they're first or second player
      if (isEven(numOfUsers)) {
        io.emit('playerTwo')
      } else {
        io.emit('playerOne')
      };




    });


  //Creates new player data
    socket.on('newPlayer', function() {
    //  gameState.players[socket.id] = {
        gameState.push({
        id : socket.id,
        username: username[0],
        hp: 100,
        maxPower: 5,
        currentPower: 5,
        ammo: 6,
        oxygen: 100,
        playerLocationTileCode: 0
      })
      console.log(gameState[0]);
      console.log(gameState[1]);
    });

socket.on("getId", function() {
    io.emit('userId', socket.id);
});

socket.on("getGamestate", function() {
    io.emit('userId', socket.id);
});


//Receive chat message and then send chat messsage to room
  socket.on('message', function(message, uname) {
    console.log("Message from " + socket.uname + " in room #" + message.roomno + ": " + message.msg);
    //io.emit('message' , {sender: socket.uname, msg: message});
    io.sockets.in("room-"+message.roomno).emit('message' , {sender: socket.uname, msg: message.msg});
  });

  socket.on('currentPosition', function(currentTileNum) {
    gameState.playerOneCurrentLocation = currentTileNum;
    console.log("Player is on tile num: " + gameState.playerOneCurrentLocation);

  });

  //Action when player disconnects
  socket.on('disconnect', () => {
    numOfUsers--
    console.log('user disconnected - ' + numOfUsers + ' total users');
  //  delete gameState.players[0];
    socket.leave("room-"+roomno);

});



});

http.listen(3000, () => {
  console.log('listening on :3000');
});


//Generate random number
function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

//check if number is even
function isEven(value) {
	if (value%2 == 0)
		return true;
	else
		return false;
}

//Generate Player Starting Positions
function generateStartPos(){
    firstPlayerStartPos = randomInteger(0, 39);
    secondPlayerStartPos = randomInteger(50, 89);
};
