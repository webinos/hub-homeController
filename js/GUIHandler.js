	var icons = {
		"http://webinos.org/api/sensors.temperature": "temperature-icon.png",
		"http://webinos.org/api/sensors.humidity": "humidity-icon.png",
		"http://webinos.org/api/sensors.light": "light-icon.png",
		"http://webinos.org/api/sensors.voltage": "voltage-icon.png",
		"http://webinos.org/api/sensors.electricity":"electricity-icon.png",
		"http://webinos.org/api/actuators.switch": "switch-icon.png",
		"http://webinos.org/api/sensors.proximity": "proximity-icon.png",
		"http://webinos.org/api/actuators.linearmotor": "switch-icon.png",
		"http://webinos.org/api/sensors.heartratemonitor": "heartratemonitor-icon.png"
	};

	var sensors = {};
	var sensorActive = {};

	var actuators = {};

	var num_boxes = 0;
	var that = this;


	var initGUI = function(){
		findSensorServices();
		addOperationsGUI();
	}


	function addOperationsGUI(){
		var html = "";
		html += '<tr><td><img width="80px" height="80px" src="./assets/greater.png" id="operation_greater" /></td></tr><tr><th>Greater than</th></tr>';
		html += '<tr><td><img width="80px" height="80px" src="./assets/lesser.png" id="operation_lesser" /></td></tr><tr><th>Lesser than</th></tr>';
		html += '<tr><td><img width="80px" height="80px" src="./assets/and.png" id="bool_and" /></td></tr><tr><th>AND</th></tr>';
		html += '<tr><td><img width="80px" height="80px" src="./assets/or.png" id="bool_or" /></td></tr><tr><th>OR</th></tr>';
		html += '<tr><td><img width="80px" height="80px" src="./assets/user_input.png" id="userInput_input" /></td></tr><tr><th>User Input</th></tr>';
        jQuery("#operations_table").append(html);
        initDragAndDrop("operation_greater");
        initDragAndDrop("operation_lesser");
        initDragAndDrop("bool_and");
        initDragAndDrop("bool_or");
        initDragAndDrop("userInput_input");
	}

	var findSensorServices = function(){
		jQuery("#sensors_table").empty();
		jQuery("#actuators_table").empty();

		webinos.discovery.findServices(new ServiceType("http://webinos.org/api/*"), {
			onFound: function (service) {
				//found a new sensors
				if(service.api.indexOf("sensors.") !== -1){
					sensors[service.id] = service;
					sensorActive[service.id] = false;
					
					service.bind({
						onBind:function(){
		        			service.configureSensor({rate: 500, eventFireMode: "fixedinterval"}, 
		        				function(){
		        					var sensor = service;

		        					var div_id = "sensor_"+sensor.id;

                                    var sensorCode = '<tr><td><img width="80px" height="80px" src="./assets/images/'+icons[sensor.api]+'" id="'+div_id+'" /></td></tr><tr><th>'+sensor.description+'</th></tr>';
                                    jQuery("#sensors_table").append(sensorCode);

                                    initDragAndDrop(div_id);

								},
								function (){
									console.error('Error configuring Sensor ' + service.api);
								}
							);
		        		}
					});
					
				}else if(service.api.indexOf("actuators.") !== -1){
					actuators[service.id] = service;
					var div_id = "actuator_"+service.id;

					var actuatorCode = '<tr><td><img width="80px" height="80px" src="./assets/images/'+icons[service.api]+'" id="'+div_id+'" /></td></tr><tr><th>'+service.description+'</th></tr>';
                    jQuery("#actuators_table").append(actuatorCode);

                    initDragAndDrop(div_id);
				}
				else if(service.api.indexOf("file") !== -1){
					if(service.serviceAddress.indexOf(".local") !== -1){
						service.bindService({
							onBind: function () {
								service.requestFileSystem(1, 1024, 
									function (filesystem) {
										root_directory = filesystem.root;
									},
									function (error) {
										alert("Error requesting filesystem (#" + error.code + ")");
									}
								);					
							}
						});
					}
				}//THE END - If-Else - Actuators & Sensors & Files
			}
		});
	}


	//set onDragStart for all types of boxes
	var addOnDragStart = function(id){

		var box = document.getElementById(id);

		box.ondragstart = function(event) {
			event.dataTransfer.setData("boxes", id);
		}
	}

	var addDragEventsForTarget = function(){

		var target = document.getElementById("target2");

		target.ondragenter = function(event){
			//add class "valid"
			this.className = "valid";
		}

		target.ondragleave = function(event){
			//remove class "valid"
			this.className = "";
		}

		target.ondragover = function(event){
			event.preventDefault();
			return false;
		}

		target.ondrop = function(event){
			//remove class "valid"
			this.className = "";

			var dd_box_name = event.dataTransfer.getData("boxes");
			var boxID = dd_box_name.split("_")[1];
			var boxType = dd_box_name.split("_")[0];


			var X = event.layerX - $(event.target).position().left;
			var Y = event.layerY - $(event.target).position().top;

			var coord = {
				x:X,
				y:Y
			}

			var result;

			switch(boxType){
				case "sensor":
					result = that.GUISensorBox(coord, sensors[boxID], dd_box_name);
					addInputBox(result);
					break;
				case "operation":
					result = that.GUIOperationBox(coord, boxID, dd_box_name);
					addProcessingBox(result);
					break;
				case "userInput":
					result = that.GUIUserInputBox(coord, dd_box_name);
					addInputBox(result);
					break;
				case "actuator":
					result = that.GUIActuatorBox(coord, actuators[boxID], dd_box_name);
					addOutputBox(result);
					break;
				case "bool":
					result = that.GUIBoolBox(coord, boxID, dd_box_name);
					addProcessingBox(result);
					break;
				default:
					alert("Error");
			}
        }
    }

    var initDragAndDrop = function(id){
		addOnDragStart(id);
		addDragEventsForTarget();
	}


	/*****************   TO CREATE INPUT/OUTPUT DESIGN   ******************/

	var greeCircle = function(){

		var exampleDropOptions = {
		    tolerance:"touch",
		    hoverClass:"dropHover"
		};
		var color2 = "#316b31";
	    var exampleEndpoint2 = {
	        endpoint:["Dot", { radius:15 }],
            paintStyle:{ fillStyle:color2 },
            isSource:false,
            isTarget:true,
            scope:"idem",
            connectorStyle:{ strokeStyle:color2, lineWidth:8 },
            connector: ["Bezier", { curviness:63 } ],
            maxConnections:-1, //unlimited
            beforeDetach:function(conn) {
                return confirm("Detach connection?"); 
            },
            dropOptions : exampleDropOptions
	    };

	    return exampleEndpoint2;
	}

	var blueRectangle = function(){

		var exampleDropOptions = {
		    tolerance:"touch",
		    hoverClass:"dropHover"
		};

		var exampleColor = "#00f";
	    var exampleEndpoint = {
	        endpoint:"Rectangle",
            paintStyle:{ width:25, height:21, fillStyle:exampleColor },
            isSource:true,
            isTarget:false,
            //reattach:true,
            scope:"idem",
            connectorStyle : {
                gradient:{stops:[[0, exampleColor], [0.5, "#09098e"], [1, exampleColor]]},
                lineWidth:5,
                strokeStyle:exampleColor,
                dashstyle:"2 2"
            },
            maxConnections:-1, //unlimited            
            dropOptions : exampleDropOptions
	    };
	    return exampleEndpoint;      
	}



/*****************     OPERATION   ******************/

	this.GUIOperationBox = function(coord, type, dd_box_name){
		//increment num_boxes add on target
		num_boxes++;

		idbox = dd_box_name+"_"+num_boxes;

		var html="";
		html += "<div class='window' id='"+idbox+"'>";
		html += "<div id='remove_"+idbox+"' style='clear:both;'><img width='10px' height='10px' src='./assets/x_min.png' style='float:right; margin-bottom:5px;'></img></div>";
		html += "<div style='clear:both;'>";
		if(type=="greater")
			html += '<img width="80px" height="80px" src="./assets/greater.png" id="greater" /><br><br>';
		else
			html += '<img width="80px" height="80px" src="./assets/lesser.png" id="lesser" /><br><br>';
		html += "</div>";
		html += "</div>";

		$("#main").append(html);

		var d = document.getElementById(idbox);
		d.style.left = coord.x+'px';
		d.style.top = coord.y+'px';
		
		jsPlumb.addEndpoint(idbox, { 
			anchor:"TopRight",
			parameters:{
				position:"right"
			} 
		}, greeCircle());
		jsPlumb.addEndpoint(idbox, { 
			anchor:"TopLeft",
			parameters:{
				position:"left"
			} 
		}, greeCircle());
		jsPlumb.addEndpoint(idbox, { anchor:"BottomCenter" }, blueRectangle());
    	
    	var divsWithWindowClass = jsPlumb.CurrentLibrary.getSelector(".window");
        jsPlumb.draggable(divsWithWindowClass);

        //to remove box
        $('#remove_'+idbox).on('click', function(){
			var boxID = this.id.substring(7);
			var connTMP = [];
			for (var j = 0; j < connections.length; j++){
				if(connections[j].sourceId == boxID){
                    removeProcessingConnection(connections[j].sourceId, connections[j].targetId);
				}else if(connections[j].targetId == boxID){
					var param = connections[j].getParameters();
                    removeInputConnection(connections[j].sourceId, connections[j].targetId, param.position);
				}else{
					connTMP.push(connections[j]);
				}
			}
			connections = connTMP;
			var endps = jsPlumb.getEndpoints(boxID);
            for(var h=0; h<endps.length; h++){
            	jsPlumb.deleteEndpoint(endps[h]);
            }
			deleteBox(boxID);
			$("#"+boxID).remove();
		});

        return idbox;
	}


/*****************     SENSOR   ******************/

	this.GUISensorBox = function(coord, sensor, dd_box_name){

		//increment num_boxes add on target
		num_boxes++;

		idbox = dd_box_name+"_"+num_boxes;

		var html = "";
		html += "<div class='window' id='"+idbox+"' >";
		html += "<div id='remove_"+idbox+"' style='clear:both;'><img width='10px' height='10px' src='./assets/x_min.png' style='float:right; margin-bottom:5px;'></img></div>";
		html += sensor.description+'<br><br>';
		html += '<img width="80px" height="80px" src="./assets/images/'+icons[sensor.api]+'" id="sensorIMG_'+sensor.id+'" /><br><br>';                     
	    html += "<div id='value_"+sensor.id+"'>-</div>";
	    html += "</div>";

	    $("#main").append(html);

	    var d = document.getElementById(idbox);
		d.style.left = coord.x+'px';
		d.style.top = coord.y+'px';
		
		jsPlumb.addEndpoint(idbox, { anchor:"BottomCenter" }, blueRectangle());
    	
    	var divsWithWindowClass = jsPlumb.CurrentLibrary.getSelector(".window");
        jsPlumb.draggable(divsWithWindowClass);

        //to remove box
        $('#remove_'+idbox).on('click', function(){
        	var boxID = this.id.substring(7);

        	//remove listener
            var sensorID = boxID.split("_")[1];
            sensors[sensorID].removeEventListener('sensor', onSensorEvent, false);
            sensorActive[sensorID] = false;

            //remove connections
        	var connTMP = [];
			for (var j = 0; j < connections.length; j++){
				if(connections[j].sourceId == boxID){
					var param = connections[j].getParameters();
                    removeInputConnection(connections[j].sourceId, connections[j].targetId, param.position);
				}else{
					connTMP.push(connections[j]);
				}
			}
			connections = connTMP;

			//remove GUI for endpoints
			var endps = jsPlumb.getEndpoints(boxID);
            for(var h=0; h<endps.length; h++){
            	jsPlumb.deleteEndpoint(endps[h]);
            }

            //remove GUI for box
			deleteBox(boxID);
			$("#"+boxID).remove();
		});

        return idbox;
	}


/*****************     ACTUATOR   ******************/

	this.GUIActuatorBox = function(coord, actuator, dd_box_name){

		//increment num_boxes add on target
		num_boxes++;

		idbox = dd_box_name+"_"+num_boxes;

		var html = "";
		html += "<div class='window' id='"+idbox+"' >";
		html += "<div id='remove_"+idbox+"' style='clear:both;'><img width='10px' height='10px' src='./assets/x_min.png' style='float:right; margin-bottom:5px;'></img></div>";
		html += actuator.description+'<br><br>';
		html += '<img width="80px" height="80px" src="./assets/images/'+icons[actuator.api]+'" id="actuatorIMG_'+actuator.id+'" /><br><br>';
	    html += "<div id='value_"+actuator.id+"'>-</div>";
	    html += "</div>";

	    $("#main").append(html);

	    var d = document.getElementById(idbox);
		d.style.left = coord.x+'px';
		d.style.top = coord.y+'px';
		
		jsPlumb.addEndpoint(idbox, { anchor:"TopCenter" }, greeCircle());
    	
    	var divsWithWindowClass = jsPlumb.CurrentLibrary.getSelector(".window");
        jsPlumb.draggable(divsWithWindowClass);

        //to remove box
        $('#remove_'+idbox).on('click', function(){
			var boxID = this.id.substring(7);
			var connTMP = [];
			for (var j = 0; j < connections.length; j++){
				if(connections[j].targetId == boxID){
                    removeProcessingConnection(connections[j].sourceId, connections[j].targetId);
				}else{
					connTMP.push(connections[j]);
				}
			}
			connections = connTMP;
			var endps = jsPlumb.getEndpoints(boxID);
            for(var h=0; h<endps.length; h++){
            	jsPlumb.deleteEndpoint(endps[h]);
            }
			deleteBox(boxID);
			$("#"+boxID).remove();
		});

        return idbox;
	}



/*****************     BOOLEAN   ******************/

	this.GUIBoolBox = function(coord, type, dd_box_name){
		//increment num_boxes add on target
		num_boxes++;

		idbox = dd_box_name+"_"+num_boxes;

		var html="";
		html += "<div class='window' id='"+idbox+"'>";
		html += "<div id='remove_"+idbox+"' style='clear:both;'><img width='10px' height='10px' src='./assets/x_min.png' style='float:right; margin-bottom:5px;'></img></div>";
		if(type=="and")
			html += '<img width="80px" height="80px" src="./assets/and.png" id="and" /><br><br>';
		else
			html += '<img width="80px" height="80px" src="./assets/or.png" id="or" /><br><br>';
		html += "</div>";

		$("#main").append(html);

		var d = document.getElementById(idbox);
		d.style.left = coord.x+'px';
		d.style.top = coord.y+'px';
		
		jsPlumb.addEndpoint(idbox, { 
			anchor:"TopRight",
			parameters:{
				position:"right"
			} 
		}, greeCircle());
		jsPlumb.addEndpoint(idbox, { 
			anchor:"TopLeft",
			parameters:{
				position:"left"
			} 
		}, greeCircle());
		jsPlumb.addEndpoint(idbox, { anchor:"BottomCenter" }, blueRectangle());
    	
    	var divsWithWindowClass = jsPlumb.CurrentLibrary.getSelector(".window");
        jsPlumb.draggable(divsWithWindowClass);

        //to remove box
        $('#remove_'+idbox).on('click', function(){
			alert("TODO");
		});

        return idbox;
	}



/*****************     USER INPUT VALUE    ******************/

	this.GUIUserInputBox = function(coord, dd_box_name){

		//increment num_boxes add on target
		num_boxes++;

		idbox = dd_box_name+"_"+num_boxes;

		var html = "";
		html += "<div class='window' id='"+idbox+"' >";
		html += "<div id='remove_"+idbox+"' style='clear:both;'><img width='10px' height='10px' src='./assets/x_min.png' style='float:right; margin-bottom:5px;'></img></div>";
		html += "Insert a value:<br/><br/>";
	    html += "<input type='text' id='input_val_"+idbox+"' /><br/><br/>";
	    html += "</div>";

	    $("#main").append(html);

	    var d = document.getElementById(idbox);
		d.style.left = coord.x+'px';
		d.style.top = coord.y+'px';
		
		jsPlumb.addEndpoint(idbox, { anchor:"BottomCenter" }, blueRectangle());
    	
    	var divsWithWindowClass = jsPlumb.CurrentLibrary.getSelector(".window");
        jsPlumb.draggable(divsWithWindowClass);

        //to remove box
        $('#remove_'+idbox).on('click', function(){
        	var boxID = this.id.substring(7);
        	var connTMP = [];
			for (var j = 0; j < connections.length; j++){
				if(connections[j].sourceId == boxID){
					var param = connections[j].getParameters();
                    removeInputConnection(connections[j].sourceId, connections[j].targetId, param.position);
				}else{
					connTMP.push(connections[j]);
				}
			}
			connections = connTMP;
			var endps = jsPlumb.getEndpoints(boxID);
            for(var h=0; h<endps.length; h++){
            	jsPlumb.deleteEndpoint(endps[h]);
            }
			deleteBox(boxID);
			$("#"+boxID).remove();
		});

        return idbox;
	}
