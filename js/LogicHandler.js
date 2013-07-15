//Key: SensorID/ActuatorID/divID (in GUI)
//Value: OBJECT (- Input/Processing/Output -)
var block_list = {};


function Input(id){
	var inputID = id;
	var processing_callback;

	this.input_callback = function(val){
		if(processing_callback){
			processing_callback(val,inputID);
		}
	}

	this.setProcessingCallback = function(cb){
		processing_callback = cb;
	}

	this.removeProcessingCallback = function(){
		processing_callback = null;
	}
};


function Processing(ic){
	var input_nodes = {};
	var input_nodes_position = {};
	var inner_callback = ic;
	var output_callback;

	var getArray = function(){
		var arrayTMP = [];
		if(input_nodes_position!=null && Object.keys(input_nodes_position).length==2){
			arrayTMP[0] = (input_nodes[input_nodes_position["left"]]);
			arrayTMP[1] = (input_nodes[input_nodes_position["right"]]);
		}
		else{
			for(var ids in input_nodes){
				arrayTMP.push(input_nodes[ids]);
			}
		}
		return arrayTMP;
	}

	var allElementsAreCharged = function(){
		var flag = true;
		for(var ids in input_nodes){
			if(input_nodes[ids].length === 0 || input_nodes[ids]==null){
				flag = false;
				break;
			}
		}
		return flag;
	}

	var processing_callback = function(val_from_input,inputID){
		if(input_nodes.hasOwnProperty(inputID)){
			//save value
			input_nodes[inputID] = val_from_input;
			if(allElementsAreCharged()){
				//if i have all input values -> execute logic and callback
				if(inner_callback){
					var result = inner_callback(getArray());
					if(result!=-1){
						if(output_callback)
							output_callback(result);
					}
				}
			}
		}
	}

	this.setOutputCallback = function(cb){
		output_callback = cb;
	}

	this.getProcessingCallback = function(){
		return processing_callback;
	}

	this.addInputNodes = function(id_node, position){
		input_nodes[id_node] = "";

		if(position!=null){
			if(position=="left"){
				input_nodes_position["left"] = id_node;
			}
			else if(position=="right"){
				input_nodes_position["right"] = id_node;
			}
		}
	}

	this.removeInputNodes = function(id_node, position){
		delete input_nodes[id_node];
		delete input_nodes_position[position];
	}

	this.removeOutputCallback = function(){
		output_callback = null;
	}
};


function Output(cb, id){
	var inner_callback = cb;
	var boxID = id;

	var output_callback = function(state){
		if(inner_callback){
			if(boxID!=null)
				inner_callback(state, boxID);
			else
				inner_callback(state);
		}
	}

	this.getOutputCallback = function(){
		return output_callback;
	}
};


/******************************************  FUNCTIONS  ******************************************/


var onSensorEvent = function(event){
	var sensor = {};
	if(typeof event !== "undefined"){
		sensor = sensors[event.sensorId];
		sensor.values = event.sensorValues[0] || 0;
	}

	if (sensor){
		if (!sensor.values) {
			sensor.values = [];
		}

		$("#value_"+sensor.id).empty();
		$("#value_"+sensor.id).text(sensor.values);

		for(var n in block_list){
			if(n.indexOf(sensor.id) !== -1)
				block_list[n].input_callback(sensor.values);
		}
	}
}

var greaterThan = function(values){
	//values is an array
	//values[0] = sx val
	//values[1] = dx val
	if(values.length==2){	
		if(values[0]>values[1])
			return 1;
		else
			return 0;
	}
	return -1;
}

var lesserThan = function(values){
	//values is an array
	//values[0] = sx val
	//values[1] = dx val
	if(values.length==2){	
		if(values[0]<values[1])
			return 1;
		else
			return 0;
	}
	return -1;
}

var setActuatorState = function(state,aid){
    actuator = actuators[aid];
    actuator.bind({
        onBind:function(){
			var r = actuator.range;
        	var val_array=new Array(); 
        	if(r[0].length==2){
        		if(r[0][0]==0 && r[0][1]==1){
        			//binary actuator
        			if(state>0)
        				val_array[0]=parseFloat(1);
        			else
        				val_array[0]=parseFloat(0);
        		}else{
        			//"decimal" actuator
        			val_array[0]=parseFloat(state);
        		}
        	}else{
        		val_array[0]=parseFloat(state);
        	}
            try{
                actuator.setValue(val_array,
                    function(actuatorEvent){
                        $("#value_"+aid).empty();
						$("#value_"+aid).text(actuatorEvent.actualValue[0]);
                    },
                    function(actuatorError){
                        //alert("[ERROR] on actuators set state: "+JSON.stringify(actuatorError));
                    }
                );
            }
            catch(err){
                console.log("Not a valid webinos actuator: " + err.message);
            }
        }
    });
}



/***************************  HELP FUNCTION TO ASSOCIATE LOGIC WITH GUI  ***************************/

function addInputBox(ID){
	block_list[ID] = new Input(ID);
}

function addProcessingBox(ID){

	if(ID.indexOf("greater") !== -1)
		block_list[ID] = new Processing(greaterThan);
	else if(ID.indexOf("lesser") !== -1)
		block_list[ID] = new Processing(lesserThan);

	/*
	else if(ID.indexOf("and"))
		//TODO
	else if(ID.indexOf("or"))
		//TODO
	*/
}

function addOutputBox(ID){
	var actuatorID = ID.split("_")[1];
	block_list[ID] = new Output(setActuatorState,actuatorID);
}

function settingSensorConnection(source, target, position){
	if(block_list[target] instanceof Processing){
		block_list[target].addInputNodes(source, position);
		block_list[source].setProcessingCallback(block_list[target].getProcessingCallback());
	}else if(block_list[target] instanceof Output){
		block_list[source].setProcessingCallback(block_list[target].getOutputCallback());
	}
	//var sensor = sensors[source.split("_")[1]];
	//sensor.addEventListener("sensor", onSensorEvent, false);
	//sensorActive[sensor.id] = true;
}

function settingUserInputConnection(source,target, position){
	if(block_list[target] instanceof  Processing){
		block_list[target].addInputNodes(source, position);
		block_list[source].setProcessingCallback(block_list[target].getProcessingCallback());
	}else if(block_list[target] instanceof Output){
		block_list[source].setProcessingCallback(block_list[target].getOutputCallback());
	}
	var val = $('#input_val_'+source).val();
	if(typeof val!=="undefined")
		block_list[source].input_callback(val);

	$('#input_val_'+source).on('change', function(){
		var vall = this.value;
	    block_list[source].input_callback(vall);
	});
}

function settingProcessingConnection(source,target){
	block_list[source].setOutputCallback(block_list[target].getOutputCallback());
}

function removeInputConnection(source,target, position){
	block_list[source].removeProcessingCallback();
	if(block_list[target] instanceof Processing)
		block_list[target].removeInputNodes(source, position);
}

function removeProcessingConnection(source, target){
	if(block_list[source] instanceof Processing)
		block_list[source].removeOutputCallback();
	else if(block_list[source] instanceof Input)
		block_list[source].removeProcessingCallback();
}

function deleteBox(idBox){
	delete block_list[idBox];
}
