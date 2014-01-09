var sensors_count=0;
var actuators_count=0;


function addSensor(){
    var row = "<tr>";
    row += "<td>S"+(++sensors_count)+"</td>";
    row += "<td><input type='text' id='sensor_id-"+sensors_count+"' value='"+next_id()+"'/></td>";
    row += "<td><input type='text' id='ad-"+sensors_count+"'/></td>";
    row += "<td><input type='text' id='pin-"+sensors_count+"'/></td>";
    row += "<td><input type='text' id='maxrange-"+sensors_count+"' value='0.1'/></td>";
    row += "<td><input type='text' id='mindelay-"+sensors_count+"' value='500'/></td>";
    row += "<td><input type='text' id='power-"+sensors_count+"' value='0.02'/></td>";
    row += "<td><input type='text' id='resolution-"+sensors_count+"' value='0.001'/></td>";
    row += "<td><input type='text' id='type-"+sensors_count+"'/></td>";
    row += "<td><input type='text' id='vendor-"+sensors_count+"' value='fake'/></td>";
    row += "<td><input type='text' id='version-"+sensors_count+"' value='1.0'/></td>";
    row += "<td><input type='text' id='convfunc-"+sensors_count+"' value='f(x)=x'/></td>";
    row += "</tr>";
    $("#sensors_tab").append(row);
    $("#sensors_tab").show();
}

function addActuator(){
    var row = "<tr>";
    row += "<td>A"+(++actuators_count)+"</td>";
    row += "<td><input type='text' id='actuator_id-"+actuators_count+"' value='"+next_id()+"'/></td>";
    row += "<td><input type='text' id='ad-"+actuators_count+"'/></td>";
    row += "<td><input type='text' id='pin-"+actuators_count+"'/></td>";
    row += "<td><input type='text' id='type-"+actuators_count+"'/></td>";
    row += "<td><input type='text' id='range-"+actuators_count+"' value='0-1'/></td>";
    row += "<td><input type='text' id='vendor-"+actuators_count+"' value='fake'/></td>";
    row += "<td><input type='text' id='version-"+actuators_count+"' value='1.0'/></td>";
    row += "</tr>";
    $("#actuators_tab").append(row);
    $("#actuators_tab").show();
}

function getConfiguration(){
    var out = "#####begin configuration#####";
    out += "\n#Copy and paste this configuration into a file named config.txt in the root folder of Arduino SD card";
    if($("#board_id").val() != "")  out += "\n\nBOARDID " + $("#board_id").val();
    if($("#pzp_ip").val() != "")    out += "\nPZPIPAD " + $("#pzp_ip").val();
    if($("#board_ip").val() != "")  out += "\nBRDIPAD " + $("#board_ip").val();
    if($("#pzp_port").val() != "")  out += "\nPZPPORT " + $("#pzp_port").val();
    if($("#board_mac").val() != "") out += "\nMACADDR " + $("#board_mac").val();
    out += "\n\n";

    for(var i=1; i<=sensors_count;i++){
        if($("#sensor_id-"+i).val() === "")
            continue;
        out += "ELEMENT " + $("#sensor_id-"+i).val() + "$";
        out += "0$"; //sensor
        out += $("#ad-"+i).val() + "$";
        out += $("#pin-"+i).val() + "$";
        out += $("#maxrange-"+i).val() + "$";
        out += $("#mindelay-"+i).val() + "$";
        out += $("#power-"+i).val() + "$";
        out += $("#resolution-"+i).val() + "$";
        out += $("#type-"+i).val() + "$";
        out += $("#vendor-"+i).val() + "$";
        out += $("#version-"+i).val() + "$";
        out += $("#convfunc-"+i).val() + "\n";
    }

    for(var i=1; i<=actuators_count;i++){
        if($("#actuator_id-"+i).val() === "")
            continue;
        out += "ELEMENT " + $("#actuator_id-"+i).val() + "$";
        out += "1$"; //actuator
        out += $("#ad-"+i).val() + "$";
        out += $("#pin-"+i).val() + "$";
        out += $("#type-"+i).val() + "$";
        out += $("#range-"+i).val() + "$";
        out += $("#vendor-"+i).val() + "$";
        out += $("#version-"+i).val() + "\n";
    }            
    out += "#####end configuration#####";
    return out;
}

function next_id(){
    var id = sensors_count+actuators_count;
    id = id.toString();
    if(id.length == 3)
        return id;
    else if(id.length>3)
        return id.substr(id.length-3);
    else{
        var num_zero = 3 - id.length;
        for(var i=0; i<num_zero; i++)
            id = "0" + id;
        return id;
    }
}