var root_directory = {};

var file_name_for_rules = "hub_rules.txt";

function save_file(data, file_name){
	root_directory.getFile(file_name, {create: true, exclusive: false}, 
		function (entry) {
			entry.createWriter(
				function (writer) {
					var written = false;
					writer.onerror = function (evt) {
						alert("Error writing file (#" + evt.target.error.name + ")");
					}

					writer.onwrite = function (evt) {
						if (!written) {
							written = true;
							writer.write(new Blob([JSON.stringify(data)]));
						}
					}
					
					writer.truncate(0);
				}, 
				function (error){
					alert("Error retrieving file writer (#" + error.name + ")");
				}
			);
		},
		function (error) {
			alert(error.message);
		}
	);
}

function load_file(file_name){
	var conf = confirm("Do you want to continue loading?");

	if(conf){
	    root_directory.getFile(file_name, {create: true, exclusive: false}, 
			function (myentry) {
				var r = new window.FileReader();
				r.onerror = function (evt) {
					alert("Error reading file (#" + evt.target.error.name + ")");
				}

				r.onload = function (evt) {
					try{
						var contents = JSON.parse(evt.target.result);

						//for rules file
						if(file_name == file_name_for_rules){
							//remove all actual elements inside the target
							clearAll_for_rules();

							//{ old boxID : new boxID }
							var boxIDassociated = {};

							//Create box UI
							for(var u in contents){
								var newBoxID = paintOneBlock(contents[u]);
								boxIDassociated[u] = newBoxID;
							}

							//Creare Connection UI (and object)
							for(var i in contents){
								addConnectionBetweenTwoBoxes(contents[i], boxIDassociated);
							}
						}
					}
					catch(err){
						//alert(err.message);
					}
				}

				myentry.file(function (fileR) {
					r.readAsText(fileR);
				}, function (error) {
					alert("Error retrieving file (#" + error.name + ")");
				});
			},
			function (error) {
				//if the file data.txt doesn't exist load the default upload image and center it
				alert("Error on read file");
			}
		);
	}
}


function save_rules(){

	var rules_to_save = {};

	var conf = confirm("Do you want to continue saving?");

	if(conf){
		for(var x in block_list){		
			rules_to_save[x] = {
				boxID: x,
				boxType: x.split("_")[0], // possible value: sensor - actuator - operation - bool - userInput
				boxSpecific:x.split("_")[1], // possible value: sensorID - actuatorID - greater - lesser - and - or - input
				userInputValue:(function(){
					//only for userInput Box - save actual value insert by user
					if(x.split("_")[0] == "userInput")
						return $('#input_val_'+x).val();
					else
						return "";
				})(),
				objType: (function(){
					if(block_list[x] instanceof Input)
						return "Input";
					if(block_list[x] instanceof Processing)
						return "Processing";
					if(block_list[x] instanceof Output)
						return "Output";
				})(),
				coord:{ 
					x: $("#"+x).position().left,
					y: $("#"+x).position().top
				},
				connections:(function(){
					var conn = [];
					for (var j = 0; j < connections.length; j++) {
	                    if(connections[j].sourceId == x){
	                    	conn.push({
	                    		from:connections[j].sourceId,
	                    		to:connections[j].targetId,
	                    		params:connections[j].getParameters()
	                    	});
	                    }
	                }
	                return conn;
				})()
			};
		}

		save_file(rules_to_save,file_name_for_rules);
	}
}


function load_rules(){
	load_file(file_name_for_rules);
}


function paintOneBlock(box){
	var id = box.boxID.substring(0,(box.boxID.length-1));
	var result;
	switch(box.boxType){
		case "sensor":
			result = that.GUISensorBox(box.coord, sensors[box.boxSpecific], id);
			addInputBox(result);
			break;
		case "operation":
			result = that.GUIOperationBox(box.coord, box.boxSpecific, id);
			addProcessingBox(result);
			break;
		case "userInput":
			result = that.GUIUserInputBox(box.coord, id);
			$("#input_val_"+result).val(box.userInputValue);
			addInputBox(result);
			break;
		case "actuator":
			result = that.GUIActuatorBox(box.coord, actuators[box.boxSpecific], id);
			addOutputBox(result);
			break;
		case "bool":
			result = that.GUIBoolBox(box.coord, box.boxSpecific, id);
			addProcessingBox(result);
			break;
		default:
			alert("Error");
	}
	return result;
}

function addConnectionBetweenTwoBoxes(box, boxIDassociated){
	//For all connection in which box.boxID is source - i create a connection
	if(box.connections.length > 0){
		for(var j=0; j<box.connections.length; j++){
			var newSourceBoxID = boxIDassociated[box.connections[j].from];
			var newTargetBoxID = boxIDassociated[box.connections[j].to];
			var newParams = box.connections[j].params;

			var sourceEndpoint;
			var targetEndpoint;

			var endps = jsPlumb.getEndpoints(newSourceBoxID);
			if(endps.length == 1){
				sourceEndpoint = endps[0];
			}else{
		        for(var h=0; h<endps.length; h++){
		        	var params = endps[h].getParameters();
		        	if(typeof params !== "undefined"){
		        		if(params.position == newParams.position)
		        			sourceEndpoint = endps[h];
		        	}
		        }
	    	}

	        var endpt = jsPlumb.getEndpoints(newTargetBoxID);
	        if(endpt.length == 1){
				targetEndpoint = endpt[0];
			}else{
		        for(var h=0; h<endpt.length; h++){
		        	var params = endpt[h].getParameters();
		        	if(typeof params !== "undefined"){
		        		if(params.position == newParams.position)
		        			targetEndpoint = endpt[h];
		        	}
		        }
	    	}

	    	//create connection
			jsPlumb.connect({ 
				source:sourceEndpoint,
				target:targetEndpoint
			});
	
		}
	}
}

function clearAll_for_rules(){

	//remove event listener:
	for(i in sensorActive){
		if(sensorActive[i] == true){
			sensors[i].removeEventListener('sensor', onSensorEvent, false);
        	sensorActive[i] = false;
		}
	}

	for(x in block_list){
		//remove GUI for endpoints
		var endps = jsPlumb.getEndpoints(x);
		for(var h=0; h<endps.length; h++){
			jsPlumb.deleteEndpoint(endps[h]);
		}
		//remove GUI of box
		$("#"+x).remove();
	}

	block_list = {};
	connections = [];
}