/**
 * Akhil Dalal
 * 100855466
 * COMP 2406
 * Assignment 4
 * 23rd November 2016
 *
 * Client side script for assignment 4.
 *
 * Codebase taken from Tutorial 7 - 
 * http://people.scs.carleton.ca/~arunka/courses/comp2406/tutorials/Tutorial07/index.html
 */

var userName;

$(document).ready(function(){
	userName = prompt("What's your name?")||"User";

	var socket = io(); //connect to the server that sent this page
	
	socket.on('connect', function(){
		socket.emit("intro", userName);
	});

	$('#inputText').keypress(function(ev){
		if(ev.which===13){
			//send message
			socket.emit("message",$(this).val());
			ev.preventDefault(); //if any
			$("#chatLog").append((new Date()).toLocaleTimeString()+", "+userName+": "+$(this).val()+"\n")
			$(this).val(""); //empty the input
		}
	});

	socket.on("message",function(data){
		$("#chatLog").append(data+"\n");
		$('#chatLog')[0].scrollTop=$('#chatLog')[0].scrollHeight; //scroll to the bottom
	});

	// Users in chat.
	socket.on("userList", function(data){
		$('#userList').empty();
		
		for (var i in data.users){
			var item = $("<li>"+data.users[i]+"</li>");
			item.on('dblclick', clickHandler);
			$('#userList').append(item);
		}
	});
	
	/* callback for privateMessage and blockUser events. */
	function clickHandler(e) {
		// If ctrl was pressed.
		if (e.ctrlKey) {
			socket.emit("blockUser", {username: $(this).text()});
		} else { // PM.
			var toSend = prompt("PM to " + $(this).text() + ":\n");
			// Check for cancel
			if (toSend && toSend.length !=0)
				socket.emit("privateMessage", {username: $(this).text(), message: toSend});
		}
	}
	
	// Show PM and get Reply if any.
	socket.on("privateMessage", function(data) {
		var toSend = prompt("PM from " + data.username + ": " + data.message +"\nReply:");
		if (toSend && toSend.length !=0)
			socket.emit("privateMessage", {username: data.username, message: toSend});
	});
});
