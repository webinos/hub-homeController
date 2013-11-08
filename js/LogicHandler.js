//Key: SensorID/ActuatorID/divID (in GUI)
//Value: OBJECT (- Input/Processing/Output -)
var block_list = {};

var textinput_array = new Array();

//only for twitter and facebook - [key = idBox; val = PostText]
var textToPost = {};

//all actual value for sensors and actuators - [key = id_Sensor_or_Actuato; val = value]
var values_sa = {};

function Input(id){
	var inputID = id;
	//var processing_callback;
	var processing_callbacks = {};

	this.input_callback = function(val){
		for(var i in processing_callbacks){
			processing_callbacks[i](val,inputID);
		}
	}

	this.addProcessingCallback = function(owner, cb){
		processing_callbacks[owner] = cb;
	}

	this.removeProcessingCallback = function(owner){
		if(processing_callbacks[owner])
			delete processing_callbacks[owner];
	}
};


function Processing(ic, id){
	var boxID = id;
	var input_nodes = {};
	var input_nodes_position = {};
	var inner_callback = ic;
	
	//GLT
	//var output_callback;
	var output_callbacks = {};

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
						for(var i in output_callbacks){
							output_callbacks[i](result, boxID);
						}
					}
				}
			}
		}
	}

	this.execProcessingCallback = function(){
		if(allElementsAreCharged()){
			//if i have all input values -> execute logic and callback
			if(inner_callback){
				var result = inner_callback(getArray());
				if(result!=-1){
					for(var i in output_callbacks){
						output_callbacks[i](result, boxID);
					}
				}
			}
		}
	}

	this.addOutputCallback = function(owner, cb){
		output_callbacks[owner] = cb;
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

	this.removeOutputCallback = function(owner){
		if(output_callbacks[owner])
			delete output_callbacks[owner];
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

		//$("#value_"+sensor.id).empty();
		$("[id=value_"+sensor.id+"]").empty();
		//$("#value_"+sensor.id).text(sensor.values);
		$("[id=value_"+sensor.id+"]").text(sensor.values);

		//save the actual value in object values_sa
		values_sa[sensor.id] = sensor.values;

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
		if(parseInt(values[0])>parseInt(values[1]))
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

		if(parseInt(values[0])<parseInt(values[1]))
			return 1;
		else
			return 0;
	}
	return -1;
}

var ANDManagment = function(values){
	if(values.length>=2){
		for(var i in values){
			if( parseInt(values[i]) == 0)
				return 0;
		}
		return 1;
	}
	return -1;
}

var ORManagment = function(values){
	if(values.length>=2){
		for(var i in values){
			if( parseInt(values[i]) == 1)
				return 1;
		}
		return 0;
	}
	return -1;	
}

var setActuatorState = function(state,aid){
	var actuatorID = aid.split("_")[1];
    var val_array = new Array(); 

    actuator = actuators[actuatorID];

    if(actuator.api.indexOf("twitter") !== -1 || actuator.api.indexOf("facebook") !== -1){
    	val_array = getValueForExernalServices(aid);
    }
    else{
    	val_array = getValueForRealActuator(aid, actuatorID, state);
	}

	try{
		actuator.setValue(val_array,
	        function(actuatorEvent){
	        	//TODO - It's necessary to implement the callback for facebook and twitter driver
	            $("#value_"+aid).empty();
				$("#value_"+aid).text(actuatorEvent.actualValue[0]);
				values_sa[actuatorEvent.actuatorId] = actuatorEvent.actualValue[0];
	        },
	        function(actuatorError){
	        }
	    );
    }
    catch(err){
        console.log("Not a valid webinos actuator: " + err.message);
    }
}


function getValueForExernalServices(aid){
    var text = textToPost[aid];
	var regExpress = / /;
	var text_sensor_split = text.split(regExpress);
	var str_post = "";
	for(var t in text_sensor_split){
		if( text_sensor_split[t].indexOf("[SENSOR]") !== -1 ){
			var regExpressSensor = /[(SENSOR)\].\[\/(SENSOR)]/;
			var tmp_1 = text_sensor_split[t].split(regExpressSensor);
			for(var y in tmp_1){
				if((tmp_1[y] in values_sa))
					str_post = str_post + " " + values_sa[tmp_1[y]];
				else
					str_post = str_post + " " + tmp_1[y];
			}
		}else if( text_sensor_split[t].indexOf("[ACTUATOR]") !== -1 ){
			var regExpressActuator = /[(ACTUATOR)\].\[\/(ACTUATOR)]/;
			var tmp_2 = text_sensor_split[t].split(regExpressActuator);
			for(var y in tmp_2){
				//values_sa
				if((tmp_2[y] in values_sa))
					str_post = str_post + " " + values_sa[tmp_2[y]];
				else
					str_post = str_post + " " + tmp_2[y];
			}
		}else{
			str_post = str_post + " " + text_sensor_split[t];
		}
	}

	return new Array(str_post);
}

function getValueForRealActuator(aid, actuatorID, state){
	var r = actuators[actuatorID].range;
	var val_array = new Array();
	//if the user has setted a specific value for "true" and "false" - I send these values to the actuator!
	if( $('#actuator_false_'+aid).val()!=="" || $('#actuator_true_'+aid).val()!=="" ){
		if(state > 0){
			if($('#actuator_true_'+aid).val()!=="")
				val_array[0]=parseFloat($('#actuator_true_'+aid).val());
			else
				val_array[0]=parseFloat(1);
		}
		else{
			if($('#actuator_false_'+aid).val()!=="")
				val_array[0]=parseFloat($('#actuator_false_'+aid).val());
			else
				val_array[0]=parseFloat(0);
		}
	}
	else{
		//now, I verify if the actuator is binary or decimal
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
	}
	return val_array;
}

/***************************  HELP FUNCTION TO ASSOCIATE LOGIC WITH GUI  ***************************/

function addInputBox(ID){
	block_list[ID] = new Input(ID);
}

function addProcessingBox(ID){
	if(ID.indexOf("greater") !== -1)
		block_list[ID] = new Processing(greaterThan, ID);
	else if(ID.indexOf("lesser") !== -1)
		block_list[ID] = new Processing(lesserThan, ID);
	else if(ID.indexOf("and") !== -1)
		block_list[ID] = new Processing(ANDManagment, ID);
	else if(ID.indexOf("or") !== -1)
		block_list[ID] = new Processing(ORManagment, ID);
}

function addOutputBox(ID){
	//var actuatorID = ID.split("_")[1];
	block_list[ID] = new Output(setActuatorState,ID);
}

function settingSensorConnection(source, target, position){
	if(block_list[target] instanceof Processing){
		block_list[target].addInputNodes(source, position);
		block_list[source].addProcessingCallback(target,block_list[target].getProcessingCallback());
	}else if(block_list[target] instanceof Output){
		block_list[source].addProcessingCallback(target, block_list[target].getOutputCallback());
	}
}

function settingUserInputConnection(source,target, position){
	if(block_list[target] instanceof  Processing){
		block_list[target].addInputNodes(source, position);
		block_list[source].addProcessingCallback(target,block_list[target].getProcessingCallback());
	}else if(block_list[target] instanceof Output){
		block_list[source].addProcessingCallback(target, block_list[target].getOutputCallback());
	}
	var val = $('#input_val_'+source).val();
	if(typeof val!=="undefined"){
		block_list[source].input_callback(val);
	}
	if(textinput_array.indexOf(source) == -1){
		//event onchange or onkeyup?
		$('#input_val_'+source).on('keyup', function(){
			var vall = this.value;
		    block_list[source].input_callback(vall);
		});
		textinput_array.push(source);
	}
}

function settingProcessingConnection(source,target){
	if(block_list[target] instanceof Output){

		block_list[source].addOutputCallback(target, block_list[target].getOutputCallback());

		block_list[source].execProcessingCallback();

	}else if(block_list[target] instanceof Processing){
		block_list[target].addInputNodes(source, null);
		//block_list[source].setOutputCallback(block_list[target].getProcessingCallback());
		block_list[source].addOutputCallback(target, block_list[target].getProcessingCallback());
	}
}

function removeInputConnection(source,target, position){
	//on source
	if(block_list[source] instanceof Input){
		block_list[source].removeProcessingCallback(target);
	}
	else if(block_list[source] instanceof Processing)
		block_list[source].removeOutputCallback();

	//on target
	if(block_list[target] instanceof Processing)
		block_list[target].removeInputNodes(source, position);

	/*
	block_list[source].removeProcessingCallback();
	if(block_list[target] instanceof Processing)
		block_list[target].removeInputNodes(source, position);
	*/
}

function removeProcessingConnection(source, target){
	if(block_list[source] instanceof Processing){
		block_list[source].removeOutputCallback(target);
	}
	else if(block_list[source] instanceof Input){
		block_list[source].removeProcessingCallback(target);
	}
}

function deleteBox(idBox){
	if(block_list[idBox] instanceof Input){
		var index = -1;
		for(var i=0; i<textinput_array.length;i++){
			if(textinput_array[i] == idBox){
				index = i;
				break;
			}
		}
		if(index != -1)
			textinput_array.splice(index,1);
	}
	delete block_list[idBox];
}
