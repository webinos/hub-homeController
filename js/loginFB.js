//APP ID selected by user
var FB_APP_ID = "";

var init_fb_done = "";

var initDone = false;


function initFacebook()
{
    if(init_fb_done != FB_APP_ID){
        FB._initialized = false;
        FB.init({
          appId  : FB_APP_ID,
          status : false, // check login status
          cookie : false, // enable cookies to allow the server to access the session
          xfbml  : false  // parse XFBML
        });
        FB.getLoginStatus(onFacebookLoginStatus);
    }else{
        FB.getLoginStatus(onFacebookLoginStatus);
    }
};


//the login function
function facebookLogin()
{
    //in another tab of browser
    //var CallbackURL = "http://localhost.com:8080/apps/webinos-app-hub-homeController/success.html";
    var part1_callback = window.location.href.split("rules.html");
    var cb = part1_callback[0] + "success.html";
    console.log(cb);
    var loginUrl="http://www.facebook.com/dialog/oauth/?"+
        "scope=publish_stream&"+
        "client_id="+FB_APP_ID+"&"+
        "redirect_uri="+cb+"&"+
        "response_type=token";
    window.open(loginUrl, '_blank');
}


//Callback function for FB.login
function onFacebookLoginStatus(response)
{
    if (response.status=="connected" && response.authResponse)
    {
        console.log("Facebook - connected");
        var popup = $("#settings-container");
        popup.fadeOut();
    }
    else
    {
        console.log("Facebook - no authorized");
        facebookLogin();
        var popup = $("#settings-container");
        popup.fadeOut();
    }

    init_fb_done = FB_APP_ID;
}


// Load the SDK asynchronously
(function(d){
	var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
	if (d.getElementById(id)) {return;}
	js = d.createElement('script'); js.id = id; js.async = true;
	js.src = "//connect.facebook.net/en_US/all.js";
	ref.parentNode.insertBefore(js, ref);
}(document));


function GUIaskForAppID(actualAppID){

    $('#settings-content').empty();
    $("#settings-container").fadeIn(1000);

    var html = "";
    html += "<div>";
    html += "<div id='input_popup' class='facebook_appID_popup'>";
    if(actualAppID != "")
        html += "<h1 id='new_appID_fb'>" + actualAppID + "</h1>";
    else
        html += "<h1 id='new_appID_fb'></h1>";
    html += "</div>";
    html += "<input type='button' value='Use actual APP_ID' id='btn_oldAppID_config'/>";
    html += "<div><textarea id='textarea_appID' class='textarea_popup'></textarea></div>";
    html += "<div>";
    html += "<input type='button' value='Save new APP_ID' id='btn_newAppID_config'/>";
    html += "</div>";
    $('#settings-content').append(html);

    $('#btn_newAppID_config').on('click', function(){
        if($("#textarea_appID").val() == "")
            alert("Error! Inser a appID of a valid facebook application!");
        else{
            save_facebook_config($("#textarea_appID").val());
            FB_APP_ID = $("#textarea_appID").val();
            initFacebook();
        }
    });

    $('#btn_oldAppID_config').on('click', function(){
        var text = document.getElementById("new_appID_fb");
        var val = text.innerHTML;
        if(val == "")
            alert("Error! Inser a appID of a valid facebook application!");
        else{
            FB_APP_ID = val;
            initFacebook();
        }
    });
}