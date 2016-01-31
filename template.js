var templateEngine = {
	load: function (url, data, target, clear)	{
		var defer = $.Deferred();
		var promise = defer.promise();
		promise.progress(function() {
			if (clear === undefined) {
				clear = false;
			}

			if (clear == true && target !== undefined) {
				target.html('');
			}

			templateEngine.getData(url).then(function(template) {
				url = template;
				templateEngine.getData(data).then(function (template) {
					data = template;
					templateEngine.loadData(url, data).then(function (output) {
						if( target !== undefined ) {
							if( target.html() != undefined ) {
								target.append(output);
							}else{
								console.error('target does not exist');
								console.error(target);
							}
						}
						defer.resolve(output, data);
					});
				})
			});
		});
		defer.notify();

		return promise;
	},

	getData: function (url) {
		var defer = $.Deferred();
		var promise = defer.promise();
		promise.progress(function() {
			if (!/[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/.test(url)) {
				defer.resolve(url);
			} else {
				if(url.indexOf('{') > -1 ){
					defer.resolve(url);
				}else {
					$.ajax({
						url: url,
						error: function (jqXHR, textStatus, errorThrown) {
							console.log(jqXHR);
						},
						success: function (template, textStatus, xhr) {
							defer.resolve(template);
						}
					});
				}
			}
		});

		defer.notify();
		return promise;
	},

	loadData: function (template, data) {
		var defer = $.Deferred();
		var promise = defer.promise();
		promise.progress(function() {
			var string = '';
			if ($.type(data) == "array") {
				$.each(data, function (key, value) {
					string += templateEngine.execute(template, value);
				});
				defer.resolve(string);
			} else {
				 string = templateEngine.execute(template, data);
				defer.resolve(string);
			}
		});

		defer.notify();

		return promise;
	},

	execute: function (template, data) {
		return template.replace(/{([^{}]*)}/g,
			function (a, b) {
				if(b.indexOf('.') > -1 && b.indexOf('$') < 0 && b.indexOf(' ') < 0 && b.indexOf("\n") < 0){
					var array = b.split('.');
					var r = data;
					if(r.length > 0) {
						$.each(array, function (k, v) {
							r = r[v];
						});
					}
					return typeof r === 'string' || typeof r === 'number' ? r : a;
				}else {
					var r = data[b];
					return typeof r === 'string' || typeof r === 'number' ? r : a;
				}
			}
		);
	}
};