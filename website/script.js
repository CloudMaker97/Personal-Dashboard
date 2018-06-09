var socket = io();

socket.on('UpdateModules', function(Modules) {
  if(Modules.FinTS_HCBI) {
    $("#Module_FinTS_HCBI").show();
  } else {
    $("#Module_FinTS_HCBI").hide();
  }

  if($(".Module:visible").length == 0) {
    $("#Module_Notifies").show();
    $("#Module_Notifies").text("Keine Module aktiviert");
  } else {
    $("#Module_Notifies").hide();
    $("#Module_Notifies").text("");
  }
});

$(document).on('click','ul li button', function(){
  alert("Rufnummer "+ $(this).data('tel') + " wird gewählt...");
  socket.emit('FritzDialNumber', $(this).data('tel'));
})

$('#IncomingCallback').click(function() {
  socket.emit('FritzDialNumber', $(this).data('tel'));
})

socket.on('OnIncomingCall', function(data) {
  $('#IncomingCallerInfo').text("Eingehender Anruf: "+data.caller);
  $('#IncomingCallback').data('tel', data.caller);
  $('#IncomingCall').modal('show');
});

socket.on('UpdateKontenDaten', function(data) {
  $('#FinTS_Saldo').text(data.saldo.value)
})

socket.on('UpdateDateAndTime', function(data) {
  $("#Time_LTS").text(data.time);
  $("#Time_DAY").text(data.day);
  $("#Time_DATE").text(data.date);
});

socket.on('UpdateCallHistory', function(data) {
  $("#Fritz_LoadHistory").remove();
  $("#Fritz_CallHistory").children().remove();
  $(data).each(function(index) {
    var TelNumberString = data[index].number;
    var ShowString = "";
    var TypeString = "";

    // Anruferanzeige
    if(data[index].name !== "") {
      ShowString = "<span>"+data[index].name+"</span>";
    } else {
      ShowString = "<span>"+TelNumberString+"</span>";
    }

    // Anruftyp
    if(data[index].type == "incoming") {
      if(data[index].name !== "") {
        TypeString = '<i class="material-icons" title="Eingehend">call_received</i>'
      } else {
        TypeString = '<a href="http://www.anrufer-bewertung.de/'+TelNumberString+'" target="_blank"><i class="material-icons" title="Eingehend (unbekannt)">call_received</i></a>'
      }
    }
    if(data[index].type == "missed") {
      if(data[index].name !== "") {
        TypeString = '<i class="material-icons" title="Verpasst">call_missed</i>'
      } else {
        TypeString = '<a href="http://www.anrufer-bewertung.de/'+TelNumberString+'" target="_blank"><i class="material-icons" title="Verpasst (unbekannt)">call_missed</i></a>'
      }
    }
    if(data[index].type == "outgoing") {
      TypeString = '<i class="material-icons" title="Ausgehend">call_made</i>'
    }

    if(index <= 10) {
      $("#Fritz_CallHistory").append("<li>"+TypeString+" <button class='btn btn-sm btn-default' data-tel='"+TelNumberString+"'>Tel.</button> <a href='tel:"+TelNumberString+"' class='btn btn-sm btn-outline-primary' data-tel='"+TelNumberString+"'>Mob.</a> "+ShowString+"</li>");
    } else {
      return;
    }
  });
})
