/**
 * Akhil Dalal
 * 100855466
 * COMP 2406
 * Assignment 4
 * 23rd November 2016
 *
 * Extend the chat room with additional features such as - Private messaging and blocking.
 *
 * Codebase taken from Tutorial 7 - 
 * http://people.scs.carleton.ca/~arunka/courses/comp2406/tutorials/Tutorial07/index.html
 */

// Modules
var http = require('http').createServer(handler);
var io = require('socket.io')(http);
var fs = require('fs');
var url = require('url');
var mime = require('mime-types');

const ROOT = "./public_html"

http.listen(2406);
console.log("Chat server listening on port 2406");

/*
 Function to handle incoming requests.
 */
function handler(req,res){
	console.log("request for " + req.url);
	
	var urlObj = url.parse(req.url);
	var filename = ROOT+urlObj.pathname;;
	
	fs.stat(filename,function(err, stats){
		if(err){ // stat couldn't find the file/folder, send 404.
			res.writeHead(404);
			res.end("404 not found - No such file or folder!");
		}else{ // found.
			// if dir, send index.html for that dir.
			if(stats.isDirectory())	filename+="/index.html";
			
			// read and send.
			fs.readFile(filename, function(err,data){				
				if(err){ // found file but couldnt read it.
					console.log("ERROR - " + err + "\n");
					res.writeHead(500);
					res.end("500 - Internal server error.");
				}else{
					res.writeHead(200, {'content-type': mime.lookup(filename)||'text/html'});
					res.end(data);
				}
			});
		}
	});	
} // end of handler.

// connected users' sockets.
var clients = [];

// socket.io routing.
io.on("connection", function(socket){
	console.log("Got a connection");

	// set up and announce new user to chat room.
	socket.on("intro",function(data){
		socket.username = data;
		clients.push(socket); // add user to userlist
		socket.broadcast.emit("message", timestamp()+": "+socket.username+" has entered the chatroom.");
		io.emit("userList", {users: getUserList()});
		socket.emit("message","Welcome, "+socket.username+".");
	});
	
	socket.on("message", function(data){
		console.log("got message: "+data);
		socket.broadcast.emit("message",timestamp()+", "+socket.username+": "+data);
	});
	
	// PRIVATE MESSAGE
	socket.on("privateMessage", function(data){
		console.log("got private message from " + socket.username + " to " + data.username + ": "+data.message);
		
		// find the user and send the message
		var sendTo = getUserSocket(data.username);
		
		if (sendTo != -1) {
			// if receiver has no blockedList or if he does and this guy isn't in it.
			if (sendTo.blockedList === undefined 
				|| sendTo.blockedList.length === 0 
				|| sendTo.blockedList.indexOf(socket.username) === -1){
				sendTo.emit("privateMessage", {username: socket.username, message: data.message});
			}
		} else {
			console.log("No such user - which shouldn't happen...");
		}
	});

	// BLOCK USER
	socket.on("blockUser", function(data){
		// If the list has already been created.
		if (socket.blockedList != undefined) {
			//check if user is there - 
			// if he is, remove him
			// else add him.
			if (socket.blockedList.indexOf(data.username) != -1) {
				socket.blockedList = socket.blockedList.filter(function(ele){
					return ele !== data.username;
				});
				socket.emit("message", data.username + " has been unblocked!");
			} else {
				socket.blockedList.push(data.username);
				socket.emit("message", data.username + " has been blocked!");
			}
		} else { // if list hasn't been created, create one.
			socket.blockedList = [];
			socket.blockedList.push(data.username);
			socket.emit("message", data.username + " has been blocked!");
		}
	});
	
	
	socket.on("disconnect", function(){
		clients = clients.filter(function(ele){  
			return ele!==socket;
		});
		io.emit("userList", {users: getUserList()});
		console.log(socket.username+" disconnected");
		io.emit("message", timestamp()+": "+socket.username+" disconnected.");
	});
	
});

/*
	Helper function - finds the given users socket
*/
function getUserSocket(usr) {
	var ret;
	
	for(var i=0;i<clients.length;i++){
        if(clients[i].username === usr)
			return clients[i];
    }
	
	return -1;
}

function getUserList(){
    var ret = [];
    for(var i=0;i<clients.length;i++){
        ret.push(clients[i].username);
    }
    return ret;
}

function timestamp(){
	return new Date().toLocaleTimeString();
}