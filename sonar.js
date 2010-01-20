var sonar = document.sonar || {};

sonar.LoadProjects = function(sonar_url_or_callback, callback) {
    var params = {}, sonar_url;
    params[gadgets.io.RequestParameters.CONTENT_TYPE] = gadgets.io.ContentType.JSON;

    //We are dealing with a sonar url
    if (typeof sonar_url_or_callback === "string" ) {
        sonar_url = sonar_url_or_callback;
    } else {
        var prefs = new gadgets.Prefs();
        sonar_url = prefs.getString("sonar_url");
        callback = sonar_url_or_callback;
    }

    gadgets.io.makeRequest(sonar_url + "api/resources?format=json&time=" + new Date().getTime(), callback, params);
};

sonar.GetMetrics = function(metrics, callback, extras) {
    var prefs = new gadgets.Prefs(), params = {}, url;
    url = prefs.getString("sonar_url") + "api/resources?format=json&resource=" + prefs.getString("sonar_project") + "&metrics=" + metrics + "&time=" + new Date().getTime();

    for (key in extras) {
        url = url + "&" + key + "=" + extras[key]
    }

    params[gadgets.io.RequestParameters.CONTENT_TYPE] = gadgets.io.ContentType.JSON;
    gadgets.io.makeRequest(url, callback, params);
}

sonar.EditPreferences = function() {
    $("#preferences").show();
    $("#body").hide();

    //Update the list of project if the url has changed
    var old_url;
    $("#id_url").focus(function() {
        old_url = $("#id_url").val();
    });
    $("#id_url").blur(function() {
        if (old_url != $("#id_url").val()) {
            sonar.UpdateProjectList($("#id_url").val());
        }
    });

    var prefs = new gadgets.Prefs();

    $("form").submit(function() {
        sonar.SavePreferences();
        $("#preferences").hide();
        $("#body").show();
        $("#preferences").trigger("finish_edit");
        return false;
    })

    $("#id_url").val(prefs.getString("sonar_url"));
    sonar.UpdateProjectList();
    gadgets.window.adjustHeight($(document).height());
};

sonar.SavePreferences = function() {
    var prefs = new gadgets.Prefs(),
        sonar_url = $("#id_url").val();


    //We check if the url given is valid, if not, we don't save
    sonar.LoadProjects(sonar_url, function(res) {
        if (res.rc != 200) {
            $("#id_url").css("border-color", "red");
            $("#id_project").empty();
            return;
        }
    });

    prefs.set("sonar_url", sonar_url, "sonar_project", $("#id_project").val(), "is_configured", "1");
};

sonar.UpdateProjectList = function(sonar_url) {
    var prefs = new gadgets.Prefs();
    if (sonar_url === undefined || sonar_url === null) {
        sonar_url = prefs.getString("sonar_url");
    }
    if (sonar_url === null || sonar_url.length === 0) {
        $("#id_project").empty();
    }
    else {
        sonar.LoadProjects(sonar_url, function(res) {
            if (res.rc != 200) {
                $("#id_url").css("border-color", "red");
                $("#id_project").empty();
                return;
            }
            $("#id_url").css("border-color", "");
            var options = [],
                project = prefs.getString("sonar_project");
            for (var i = 0; i < res.data.length; i++) {
                options.push('<option value="', res.data[i].key,  '"');
                if (res.data[i].key == project) {
                    options.push(' selected="selected"');
                }
                options.push('>', res.data[i].name, "</option>");
            }
            $("#id_project").empty().append(options.join(""));
        });
    }
};
