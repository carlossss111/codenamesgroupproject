$(document).ready(function(){

  //Disable button click on cards
  function disable_buttons(){
    $('.card').css('pointer-events', 'none');
    $('#end_turn').css('pointer-events', 'none');
    $('.switch').css('pointer-events', 'none');
  }

  //Choose your roles on each team
  function choose_role() {
    blue_role = prompt("Choose your role for BLUE team:\n(1 for spy, 2 for spymaster, 3 for AI-team)", "3");
    red_role = prompt("Choose your role for RED team:\n(1 for spy, 2 for spymaster, 3 for AI-team)", "3");
  }

  //Main game loop
  function start_game(turn) {
    board[0]["turn"] = turn;
    if (board[0]["turn"] == "blue") {
      document.getElementById('blue').style.opacity = 1;
      document.getElementById('red').style.opacity = 0.5;
      if (blue_role == 1) generate_clue(ai_guess=false);
      else if (blue_role == 2) make_clue();
      else generate_clue(ai_guess=true);
    }
    else {
      document.getElementById('red').style.opacity = 1;
      document.getElementById('blue').style.opacity = 0.5;
      if (red_role == 1) generate_clue(ai_guess=false);
      else if (red_role == 2) make_clue();
      else generate_clue(ai_guess=true);
    }
  }
  
  /*
  AI generate clue and target number
  ai_guess: true - let AI generate guess for this team
            false - get user-input guess for this team
  */
  function generate_clue(ai_guess) {
     $('#turn_text').html("Generating a clue");
     disable_buttons();
     $.ajax({
        type:'POST',
        url: "{{ url_for('clue')}}",
        contentType: "application/json; charset=utf-8",
        dataType: "html",
        data: JSON.stringify(board),
        success: function(clue_details){
            clue_details = JSON.parse(clue_details);
            clue = clue_details.clue;
            targets = clue_details.targets;
            board[0]["clue"] = clue;
            board[0]["target_num"] = targets.length;
            $("#clue_text").html(`Clue: ${clue} (${targets.length})`)
            remaining_guesses = targets.length;
            update_card_borders(cheat);
            if (ai_guess) generate_guess();
            else make_guess();
        }
    });
  };

  //Get user-input clue and target number
  function make_clue() {
    disable_buttons();
    $('#turn_text').html("Make your clue");
    show_type();
    document.getElementById('clue_text').style.display = 'none';
    document.getElementById('clue_input').style.display = 'block';
    document.getElementById('clue_button').addEventListener("click", submit_clue);
  }

  //Check if the clue is valid
  function check_clue(clue) {
    for (i = 1; i < 26; i++) {
      if (board[i].name == clue) {
        alert("You can't use board words!");
        return false;
      } else if (!board[0]['dict'].includes(clue)) {
        alert("Word not recognized.");
        return false;
      }
    }
    return true;
  }

  //Submit clue to the system and let AI generate guesses for this team
  function submit_clue() {
    board[0]["clue"] = document.getElementById("clue").value.toLowerCase();
    board[0]["target_num"] = document.getElementById("target_num").value;
    if (check_clue(board[0]["clue"]) == true) {
      document.getElementById('clue_text').style.display = 'block';
      document.getElementById('clue_input').style.display = 'none';
      hide_type();
      generate_guess();
    }
  }

  //AI generate guesses
  function generate_guess() {
    $('#turn_text').html("Generating guesses");
    disable_buttons();
    $.ajax({
      type:'POST',
      url: "{{ url_for('guess')}}",
      contentType: "application/json; charset=utf-8",
      dataType: "html",
      data: JSON.stringify(board),
      success: function(guesses){
        guesses = JSON.parse(guesses).guesses;
        for (const guess of guesses) {
          update_card(guess);
          if (check_end() == true) break;
        }
        if (end == false) {
          if (board[0]["turn"] == "blue") start_game("red");
          else start_game("blue");
        }
      }
    });
  }

  //Get user-input guesses
  function make_guess() {
    $('#turn_text').html("Make your guesses");
    disable_buttons();
    $('.card').css('pointer-events', 'auto');
    $('#end_turn').css('pointer-events', 'auto');
    $('.switch').css('pointer-events', 'auto');
  }

  //Make card text different
  function update_card_borders(check) {
    for (i = 0; i < targets.length; i++) {
      id = targets[i];
      if (check == true || board[id].active == true) {
          $("#"+id).css({
          "color": white,
          "text-shadow": text_shadow});
      }
      else {
        $("#"+id).css({
        "color": "black",
        "text-shadow": ""});
      }
    }
  }

  //Show types of all cards in spymaster mode
  function show_type() {
    for (i = 1; i < 26; i++) {
      if (board[i].active == false) {
        $("#"+i).css({
          "opacity": 0.5,
          "background-color": board[i].colour});
      }
    }
  }

  //Hide types of all cards in spy mode
  function hide_type() {
    for (i = 1; i < 26; i++) {
      if (board[i].active == false) {
        $("#"+i).css({
          "opacity": 1,
          "background-color": "tan"});
      }
    }
  }

  //Update card
  function update_card(id) {

    //Set the card to active
    board[id].active = true;

    //Change its colour
    $("#"+id).css({
    "color": white,
    "text-shadow": text_shadow,
    "background-color": board[id].colour});

    //Decrement the appropriate count
    if (board[id].type == "blue") {
        blue_remaining -= 1;
        $('#blue').html(blue_remaining);
    } else if (board[id].type == "red") {
        red_remaining -= 1;
        $('#red').html(red_remaining);
    } else if (board[id].type == "neutral"){
        neutral_remaining -= 1;
    } else if (board[id].type == "assassin"){
        assassin_remaining -= 1;
    }
  }

  //Check if the game has ended
  function check_end() {
    if (end == true) {
        return;
    }
    console.log(blue_remaining, red_remaining, assassin_remaining);
    if (blue_remaining == 0) {
      //Update title
      $('#turn_text').html("Blue Team Win!");
      end = true;
    }
    else if (red_remaining == 0) {
      //Update title
      $('#turn_text').html("Red Team Win!");
      end = true;
    }
    else if (assassin_remaining == 0) {
      if (board[0]["turn"] == "blue") {
        $('#turn_text').html("Red Team Win!");
      }
      else {
        $('#turn_text').html("Blue Team Win!");
      }
      end = true;
    }
    if (end == true) {
      //Disable all buttons
      disable_buttons();

      //Reveal the cards
      for (i = 1; i < 26; i++) {
        if (board[i].active == false) {
            update_card(i);
        }
      }
    }
    return end;
  }

  /*
  Setup
  */

  var board = {{board|tojson|safe}};
  var blue_role;
  var red_role;
  var remaining_guesses = 0;
  var blue_remaining = 9;
  var red_remaining = 9;
  var neutral_remaining = 6;
  var assassin_remaining = 1;
  var cheat = false;
  var targets = [];
  var clue_details = '';
  var clue = '';
  var end = false;
  var sequence = [];
  var sequence_length = 0;
  var id = 0;
  var white = "#F5F5F5";
  var text_shadow = "0 0 1px black, 0 0 1px black, 0 0 1px black, 0 0 1px black";
  var opt = {
     autoOpen: false,
     resizable: false,
     title: "Instructions",
     text: $('#dialog').load("instructions"),
     height: 500,
     width: 500
  };
  var theDialog = $("#dialog").dialog(opt);

  //Radio button setup
  $("input[type='radio']").checkboxradio();
  $("#easy").prop("checked", true);

  //Set the initial state
  choose_role();
  start_game("blue");

  /*
  Click events
  */

  // Card behaviour
  $('.card').click(function() {
     // Get the id of the card
     id = $(this).attr('id');

     if (board[id].active == false) {
        // Remove a guess
        remaining_guesses -= 1;

        // Update the clicked card
        update_card(id);
        check_end();

        // It's the other turn if we have no guesses or if we choose a bad card
        if (remaining_guesses == 0 || board[id].type != board[0]["turn"]) {
          //Remove old cheat borders
          update_card_borders(false);
          //Disable buttons
          disable_buttons();
          if (!end) {
            if (board[0]["turn"] == "blue") start_game("red");
            else start_game("blue");
          }
        }
     }
  });

  //Reset button behaviour
  $('#reset').click(function() {
     $.ajax({
        type:'POST',
        url: "/",
        dataType: "html",
        success: function(response){
          $("body").html(response);
        }
    });
  });

  //Instruction button behaviour
  $('#instructions').click(function() {
    theDialog.dialog("open");
  });

  //End turn button behaviour
  $('#end_turn').click(function() {
    computer_turn();
  });

  //Radio button behaviour
  $("input[name='difficulty']").click(function(){
    board[0].difficulty = $("input[name='difficulty']:checked").val();
  });

  //Cheat button behaviour
  $("#cheat").click(function(){
    cheat = this.checked;
    update_card_borders(cheat);
  });
});