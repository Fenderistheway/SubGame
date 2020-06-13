var express = require('express')
var app = express();
app.use(express.static('static'))

var http = require('http').createServer(app);
const PORT = process.env.PORT || 3000;
var io = require('socket.io')(http);

var uname;
var numOfUsers = 0;
var username = [];

var mySocketId;

var gameState = [];

var currentGameState = [];

var roomno = 1;

var firstPlayerStartPos;
var secondPlayerStartPos;



//Username
// Loading the index file . html displayed to the client
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/static/html/Subhunt.html');
});

io.on('connection', (socket) => {
  //Increase roomno 2 clients are present in a room.
     if(io.nsps['/'].adapter.rooms["room-"+roomno] && io.nsps['/'].adapter.rooms["room-"+roomno].length > 1) {
       roomno++;
     }
     socket.join("room-"+roomno);

     var room = io.sockets.adapter.rooms["room-"+roomno];
     console.log(room);
     setTimeout(function() {if (room.length == 2) {
       roomno++
     }}, 1000);


     //Send roomno
     io.sockets.in("room-"+roomno).emit('connectToRoom', roomno);


     if (isEven(numOfUsers)) {
       generateStartPos();
     } else {};


     currentGameState[roomno] = {
     activePlayer: 1,

     playerOnePosition: firstPlayerStartPos,
     playerOneHp: 100,
     playerOneMaxPower: 5,
     playerOneCurrentPower: 5,
     playerOneAmmo: 5,
     playerOneOxygen: 100,

     playerTwoPosition: secondPlayerStartPos,
     playerTwoHp: 100,
     playerTwoMaxPower: 5,
     playerTwoCurrentPower: 5,
     playerTwoAmmo: 5,
     playerTwoOxygen: 100,

     playerOneTorpedoLocation: "x",
     playerTwoTorpedoLocation: "x",

     playerOneHit: false,
     playerTwoHit: false,

     playerOneTakeDamage: false,
     playerTwoTakeDamage: false,
     }

     console.log("Current Game State of Room " + roomno + " " + currentGameState[roomno].playerOnePosition);



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
      /*if (isEven(numOfUsers)) {
        io.emit('playerTwo')
      } else {
        io.emit('playerOne')
      };*/
    });


//Receive request for game state, then send current game state
    socket.on('getCurrentGameState', function(roomNumber) {
        io.sockets.in("room-"+ roomNumber).emit('gState', currentGameState[roomNumber]);
      });


      socket.on('playerNumber', function(roomNumber) {
        var room = io.sockets.adapter.rooms["room-"+roomno];
        console.log(room);
        console.log(roomno);

        if (room.length == 2) {
          //io.sockets.in("room-"+ roomNumber).emit('pNum', false);
          socket.emit('pNum', false);
        } else {
          //io.sockets.in("room-"+ roomNumber).emit('pNum', true);
          socket.emit('pNum', true);
        };
      });

      socket.on('getMyPos', function(data) {
      if (data.playerNum == 1) {
        socket.emit("myPos", currentGameState[data.roomNo].playerOnePosition);
      } else if (data.playerNum == 2) {
        socket.emit("myPos", currentGameState[data.roomNo].playerTwoPosition);
      }
    });

/*Receive request for game state, then send current game state
    socket.on('playerNumber', function(roomNumber) {
      if (isEven(numOfUsers)) {
        //io.sockets.in("room-"+ roomNumber).emit('pNum', false);
        socket.emit('pNum', false);
      } else {
        //io.sockets.in("room-"+ roomNumber).emit('pNum', true);
        socket.emit('pNum', true);
      };
    }); */




/*
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

*/


//Receive chat message and then send chat messsage to room
  socket.on('message', function(message, uname) {
    console.log("Message from " + socket.uname + " in room #" + message.roomno + ": " + message.msg);
    //io.emit('message' , {sender: socket.uname, msg: message});
    io.sockets.in("room-"+message.roomno).emit('message' , {sender: socket.uname, msg: message.msg});
  });

  //Receives tile where sub wants to move and updates game state
    socket.on('currentPos', function(currentPos) {
      if (currentPos.fPlayer == true) {
        currentGameState[currentPos.roomno].playerOnePosition = currentPos.tileNum;
        currentGameState[currentPos.roomno].playerOneCurrentPower--
        console.log("Player moved to tile #: " + currentGameState[currentPos.roomno].playerOnePosition + " and they have this much power: " + currentGameState[currentPos.roomno].playerOneCurrentPower);
      } else if (currentPos.fPlayer == false) {
        currentGameState[currentPos.roomno].playerTwoPosition = currentPos.tileNum;
        currentGameState[currentPos.roomno].playerTwoCurrentPower--
        console.log("Player moved to tile #: " + currentGameState[currentPos.roomno].playerTwoPosition + " and they have this much power: " + currentGameState[currentPos.roomno].playerTwoCurrentPower);
      }
    });

    //Receives end turn trigger from player
      socket.on('endTurn', function(eTurn) {
        if (eTurn.fPlayer == true) {
          currentGameState[eTurn.roomno].activePlayer = 2;
          currentGameState[eTurn.roomno].playerOneCurrentPower = currentGameState[eTurn.roomno].playerOneMaxPower;
          currentGameState[eTurn.roomno].playerOneOxygen = currentGameState[eTurn.roomno].playerOneOxygen - 20;
          io.sockets.in("room-"+ eTurn.roomno).emit('nextTurn');
        } else if (eTurn.fPlayer == false) {
          currentGameState[eTurn.roomno].activePlayer = 1;
          currentGameState[eTurn.roomno].playerTwoCurrentPower = currentGameState[eTurn.roomno].playerTwoMaxPower;
          currentGameState[eTurn.roomno].playerTwoOxygen = currentGameState[eTurn.roomno].playerTwoOxygen - 20;
          io.sockets.in("room-"+ eTurn.roomno).emit('nextTurn');
        }
      });

    //Receives tile where sub shoots torpedo and updates game state
      socket.on('torpedoPos', function(currentPos) {
        if (currentPos.fPlayer == true) {
          currentGameState[currentPos.roomno].playerOneTorpedoLocation = currentPos.tileNum;
          currentGameState[currentPos.roomno].playerOneAmmo--;
          currentGameState[currentPos.roomno].playerOneCurrentPower = currentGameState[currentPos.roomno].playerTwoCurrentPower - 5;
          console.log("Player shot torpedo on tile #: " + currentGameState[currentPos.roomno].playerOneTorpedoLocation + " and they have this much ammo: " + currentGameState[currentPos.roomno].playerOneAmmo);
        } else if (currentPos.fPlayer == false) {
          currentGameState[currentPos.roomno].playerTwoTorpedoLocation = currentPos.tileNum;
          currentGameState[currentPos.roomno].playerTwoAmmo--
          currentGameState[currentPos.roomno].playerTwoCurrentPower = currentGameState[currentPos.roomno].playerTwoCurrentPower - 5;
          console.log("Player shot torpedo on tile #: " + currentGameState[currentPos.roomno].playerTwoTorpedoLocation + " and they have this much ammo: " + currentGameState[currentPos.roomno].playerTwoAmmo);
          }
          //Check if torpedo hits and does damage
          if (currentGameState[currentPos.roomno].playerOneTorpedoLocation == currentGameState[currentPos.roomno].playerTwoPosition) {
            currentGameState[currentPos.roomno].playerTwoHp = currentGameState[currentPos.roomno].playerTwoHp - 100;
            currentGameState[currentPos.roomno].playerTwoHit = true;
            currentGameState[currentPos.roomno].playerOneTorpedoLocation = "x";

          } else if(currentGameState[currentPos.roomno].playerTwoTorpedoLocation == currentGameState[currentPos.roomno].playerOnePosition ) {
            currentGameState[currentPos.roomno].playerOneHp = currentGameState[currentPos.roomno].playerOneHp - 100;
            currentGameState[currentPos.roomno].playerOneHit = true;
            currentGameState[currentPos.roomno].playerTwoTorpedoLocation = "x";
           }

      });

//receive that sub is rising
      socket.on('subRising', function(raise) {
      socket.to("room-" + raise.roomno).emit('subRaiseTile', raise.tileNum);
      if (raise.fPlayer == true) {
        currentGameState[raise.roomno].playerOneOxygen = 100;
      } else if (raise.fPlayer == false) {
        currentGameState[raise.roomno].playerTwoOxygen = 100;
        }

      });

  //recieve sonar pulse
  socket.on('sonarPulse', function(sonar) {
    if (sonar.fPlayer == true) {
      currentGameState[sonar.roomno].playerOneCurrentPower = currentGameState[sonar.roomno].playerOneCurrentPower - 2;
    } else if (sonar.fPlayer == false) {
      currentGameState[sonar.roomno].playerTwoCurrentPower = currentGameState[sonar.roomno].playerTwoCurrentPower - 2;
    }
  });

//Receive data to check if sonar detected opponent
socket.on('sonarCheck', function(data) {
if (data.fPlayer == true) {
  if (data.tileNum - 10 == currentGameState[data.roomno].playerTwoPosition ||
      data.tileNum - 20 == currentGameState[data.roomno].playerTwoPosition ||
      data.tileNum - 9 == currentGameState[data.roomno].playerTwoPosition ||
      data.tileNum + 1 == currentGameState[data.roomno].playerTwoPosition ||
      data.tileNum + 2 == currentGameState[data.roomno].playerTwoPosition ||
      data.tileNum + 11 == currentGameState[data.roomno].playerTwoPosition ||
      data.tileNum + 10 == currentGameState[data.roomno].playerTwoPosition ||
      data.tileNum + 20 == currentGameState[data.roomno].playerTwoPosition ||
      data.tileNum + 9 == currentGameState[data.roomno].playerTwoPosition ||
      data.tileNum - 1 == currentGameState[data.roomno].playerTwoPosition ||
      data.tileNum - 2 == currentGameState[data.roomno].playerTwoPosition ||
      data.tileNum - 11 == currentGameState[data.roomno].playerTwoPosition) {
    socket.emit('sonarOppFound', currentGameState[data.roomno].playerTwoPosition)
  }
} else if (data.fPlayer == false) {
  if (data.tileNum - 10 == currentGameState[data.roomno].playerOnePosition ||
      data.tileNum - 20 == currentGameState[data.roomno].playerOnePosition ||
      data.tileNum - 9 == currentGameState[data.roomno].playerOnePosition ||
      data.tileNum + 1 == currentGameState[data.roomno].playerOnePosition ||
      data.tileNum + 2 == currentGameState[data.roomno].playerOnePosition ||
      data.tileNum + 11 == currentGameState[data.roomno].playerOnePosition ||
      data.tileNum + 10 == currentGameState[data.roomno].playerOnePosition ||
      data.tileNum + 20 == currentGameState[data.roomno].playerOnePosition ||
      data.tileNum + 9 == currentGameState[data.roomno].playerOnePosition ||
      data.tileNum - 1 == currentGameState[data.roomno].playerOnePosition ||
      data.tileNum - 2 == currentGameState[data.roomno].playerOnePosition ||
      data.tileNum - 11 == currentGameState[data.roomno].playerOnePosition) {
    socket.emit('sonarOppFound', currentGameState[data.roomno].playerOnePosition)
  }


}



});


//  socket.on('currentPosition', function(currentTileNum) {
    //gameState.playerOneCurrentLocation = currentTileNum;
  //  console.log("Player is on tile num: " + gameState.playerOneCurrentLocation);
//  });

  //Action when player disconnects
  socket.on('disconnect', () => {
    numOfUsers--
    console.log('user disconnected - ' + numOfUsers + ' total users');
  //  delete gameState.players[0];
    socket.leave("room-"+roomno);

});



});

http.listen(PORT, () => {
  console.log('listening on :' + PORT);
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
