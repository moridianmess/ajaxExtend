var ajaxExtend = {
	version: "0.6.6",
	author: "Marc Evans (moridiweb)",
	options: {
		"hide": function(){
			if(ajaxExtend.options.theme == 'materialize') {
				$('#' + ajaxExtend.options.templateConfig.dialogId).closeModal();
			}else if(ajaxExtend.options.theme == 'bootstrap') {
				$('#' + ajaxExtend.options.templateConfig.dialogId).modal('hide');
			}
		},
		"show": function(){
			if(ajaxExtend.options.theme == 'materialize') {
				$('#' + ajaxExtend.options.templateConfig.dialogId).openModal();
			}else if(ajaxExtend.options.theme == 'bootstrap') {
				$('#' + ajaxExtend.options.templateConfig.dialogId).modal('show');
			}
		},
		"beforeSend": function (x) {
		},													/// Execute before ajax call
		"complete": function (x) {
		},														/// Execute on ajax call complete
		"success": function (data, textStatus, xhr) {
		},									/// Execute on ajax call success
		"abortCallback": function () {
		},													/// Execute on ajax abort call
		"error": function (xhr, textStatus, thrownError) {
		},							/// Execute on ajax call error
		"uploadProgress": function (event, i, position, total, percentComplete) {		/// Execute on upload progress
			var bar = $('#processing-progress_' + i + " .progress-bar");
			var percentVal = percentComplete + '%';
			bar.width(percentVal);
		},
		"url": '',																		/// URL of ajax request
		"type": 'GET',																	/// Type of ajax request
		"cache": false,																	/// Boolean on whether to cache
		"fileUpload": false,															/// Type of ajax request
		"form": $(),																	/// Form element
		"formData": {},
		"dataType": 'json',																/// data format
		"contentType": "application/json; charset=utf-8",								/// data content type
		"processData": true,															/// convert data to querystring
		"processing": true,																/// whether to show processing bar
		"data": {},																		/// data
		"authorisation": false,															/// Send authorisation request
		"authorisationHeader": 'TRUEREST',												/// Authorisation Header
		"abort": false,																	/// Boolean on whether to enable aborts
		"ajaxCalls": {},																/// store for AJAX calls
		"ajaxCallBacks": {},															/// store for AJAX call, callback event
		"key": '',																		/// Processing key
		"text": '',																		/// Processing text
		"customCall": {},																/// Config for request to be run
		"log": {},																		/// Log of requests
		"timeout": 1,
		"theme": "materialize",
		"templateDir": "/templates/ajaxExtend/",
		"progressTemplate": "",
		"templateConfig": {
			dialogId: "ajaxExtendDialog",
			bodyId: "ajaxExtendBody",
			buttonId: "ajaxExtendButton"
		},
		"offlineCache": false,
		"offlineNo": 0,
		"processRunning": false
	},

	create: function () {
		var defer = $.Deferred();
		var promise = defer.promise();
		promise.progress(function() {
			if( $('#' + ajaxExtend.options.templateConfig.dialogId).length == 0 ) {
				templateEngine.load(ajaxExtend.options.templateDir + ajaxExtend.options.theme + '/progress.html', {}).then(function(progress) {
					ajaxExtend.options.progressTemplate = progress;
					templateEngine.load(ajaxExtend.options.templateDir + ajaxExtend.options.theme + '/modal.html', ajaxExtend.options.templateConfig, $('body')).then(function () {
						$('#' + ajaxExtend.options.templateConfig.buttonId)
							.on('click', {}, function (e) {
								ajaxExtend.abortAll();
								ajaxExtend.hide();
							});

						ajaxExtend.hide();

						$(document).ajaxStop(function () {
							ajaxExtend.options.timeout = setTimeout(function () {
								ajaxExtend.hide();
							}, 500);
						});
						defer.resolve();
						$(document).trigger('processingCreate');
					});
				});
			}else{
				defer.resolve();
				$(document).trigger('processingCreate');
			}
		});
		defer.notify();
		return promise;
	},

	hide: function () {
		if( $( '#' + ajaxExtend.options.templateConfig.dialogId ).is(':visible') ) {
			ajaxExtend.options.hide();
		}
		ajaxExtend.options.processRunning = false;
		$(document).trigger('processingHide');
	},

	show: function () {
		if( !$( '#' + ajaxExtend.options.templateConfig.dialogId ).is(':visible') ) {
			ajaxExtend.options.show();
		}
		$(document).trigger('processingShow');
	},

	/// Settings for current call
	set: function (object) {
		ajaxExtend.options.customCall = $.extend(true, {}, ajaxExtend.options);
		ajaxExtend.options.customCall = $.extend(true, ajaxExtend.options.customCall, object);
		$(document).trigger('processingSet');
	},

	supportFormData: function () {
		return !!window.FormData;
	},

	/// Execute
	execute: function () {
		var options = ajaxExtend.options.customCall;
		return ajaxExtend.doExecute(options);
	},

	doExecute: function (options) {
		var defer = $.Deferred();
		var promise = defer.promise();
		promise.progress(function() {
			var parseData = options.data;
			var type = 'Object';

			if (options.data != null) {
				if (options.data['__proto__']['constructor']['name'] !== undefined) {
					type = options.data['__proto__']['constructor']['name'];
				}
			}

			if (type != 'FormData') {
				options.data = JSON.stringify(options.data)
			}

			if (options.fileUpload == true) {

				if (ajaxExtend.supportFormData()) {

					var queryString = "";

					if (options.form instanceof jQuery) {
						queryString = "?formName=" + options.form.attr('id');
					}

					$.each(parseData, function (key, value) {
						if (queryString == '') {
							queryString += '?';
						} else {
							queryString += '&';
						}
						queryString += key + '=' + value;
					});

					$.ajax({
						url: options.url + queryString,  //Server script to process data
						type: 'POST',
						beforeSend: function (x) {
							ajaxExtend.options.processRunning = true;
							var i = 0;
							var key = options.key;
							/// Get unique key
							while (ajaxExtend.options.ajaxCalls[key] !== undefined) {
								key = options.key + i.toString();
								i++;
							}

							options.key = key;

							x['id'] = options.key;

							if ($.isFunction(options.beforeSend)) {
								options.beforeSend(x);
							}

							if (options.key.indexOf('sendError') < 0) {
								ajaxExtend.options.log[options.key] = {};
								ajaxExtend.options.log[options.key]['requestType'] = options.type;
								ajaxExtend.options.log[options.key]['requestUrl'] = options.url + queryString;
								ajaxExtend.options.log[options.key]['requestData'] = formData;
							}

							ajaxExtend.options.ajaxCalls[options.key] = x;

							if (options.authorisation) {
								/// Do authorisation request
								x.setRequestHeader('Authorization', options.authorisationHeader);
							}

							var text = options.text;

							if (text == '') {
								text = options.key;
							}

							/// Start processing
							if (options.processing) {
								ajaxExtend.start(text, options.key, options.abort);
							}
							key = null;
							text = null;

						},
						"xhr": function () {
							var xhr = new window.XMLHttpRequest();

							/// Upload progress
							xhr.upload.addEventListener("progress", function (event) {
								var percent = 0;
								var position = event.loaded || event.position;
								/*event.position is deprecated*/
								var total = event.total;
								if (event.lengthComputable) {
									percent = Math.ceil(position / total * 100);
								}
								options.uploadProgress(event, options.key, position, total, percent);
								percent = null;
								total = null;
								position = null;
							}, false);
							return xhr;
						},
						"success": function (data, textStatus, xhr) {
							if (options.key.indexOf('sendError') < 0) {
								ajaxExtend.options.log[options.key]['responseData'] = data;
								ajaxExtend.options.log[options.key]['responseStatus'] = xhr.status;
								ajaxExtend.options.log[options.key]['responseText'] = xhr.responseText;
							}

							if( options.offlineCache == true ) {
								var storageKey = ajaxExtend.getStorageByValueObject({'url': options.url, 'params': options.formData});
								if( storageKey != false ) {
									localStorage.setItem(storageKey, JSON.stringify({'data': data, 'url': options.url, 'params': JSON.parse(options.formData)}) );
								}else{
									var storage = "offlineStorage" + ajaxExtend.options.offlineNo;
									ajaxExtend.options.offlineNo ++;
									localStorage.setItem(storage, JSON.stringify({'data': data, 'url': options.url, 'params': JSON.parse(options.formData)}) );
								}
							}

							if ($.isFunction(options.success)) {
								options.success(data, textStatus, xhr)
							}

							$(document).trigger('ajaxExecute');
						},
						"complete": function (x) {
							/// Find correct call and remove corresponding processing bar
							$.each(ajaxExtend.options.ajaxCalls, function (key, value) {
								if (value['id'] !== undefined) {
									if (value['id'] == x['id']) {
										ajaxExtend.end(key);
									}
								}
							});

							if ($.isFunction(options.complete)) {
								options.complete(x);
							}
							defer.resolve();
						},
						"error": function (xhr, textStatus, thrownError) {
							if (options.key.indexOf('sendError') < 0) {
								ajaxExtend.options.log[options.key]['responseStatus'] = xhr.status;
								ajaxExtend.options.log[options.key]['responseText'] = xhr.responseText;
							}

							if( options.offlineCache == true ) {
								var storageKey = ajaxExtend.getStorageByValueObject({'url': options.url, 'params': options.formData});
								if( storageKey != false ) {
									var storage = JSON.parse(localStorage.getItem(storageKey));
									if ($.isFunction(options.success)) {
										var newXhr = {
											"readyState": 4,
											"responseText": storage.data,
											"status": 200,
											"statusText": "OK"
										};
										options.success(storage.data, "success", newXhr);
									}
								}else{
									//You are offline and this dataset is not cached. Please Reconnect.
								}
							}else{
								//You are offline and this dataset is not cached. Please Reconnect.
							}

							if ($.isFunction(options.error)) {
								options.error(xhr, textStatus, thrownError);
							}
						},
						// Form data
						data: options.formData,
						//Options to tell jQuery not to process data or worry about content-type.
						cache: false,
						contentType: false,
						processData: false
					});

					queryString = null;

				} else {

					var formData = $(":text", $(options.prefix + 'Form')).serializeArray();
					ajaxExtend.options.processRunning = true;

					if (!$.isEmptyObject(options.data)) {
						$.each(options.data, function (index, value) {
							if (typeof(value) == "string") {
								formData.push({'name': index, 'value': value});
							} else {
								formData.push({'name': index, 'value': value.val()});
							}
						});
					}

					var fileData = options.fileArray.serializeArray();

					if (options.key.indexOf('sendError') < 0) {
						ajaxExtend.options.log[options.key] = {};
						ajaxExtend.options.log[options.key]['requestType'] = options.type;
						ajaxExtend.options.log[options.key]['requestUrl'] = options.url;
						ajaxExtend.options.log[options.key]['requestData'] = formData;
					}

					$.ajax(options.url, {
						data: formData,
						files: fileData,
						iframe: true,
						processData: false
					}).complete(function (data) {
						ajaxExtend.close();
						defer.resolve();
					}).success(function (data, textStatus, xhr) {
						if (options.key.indexOf('sendError') < 0) {
							ajaxExtend.options.log[options.key]['responseData'] = data;
							ajaxExtend.options.log[options.key]['responseStatus'] = xhr.status;
							ajaxExtend.options.log[options.key]['responseText'] = xhr.responseText;
						}

						if ($.isFunction(options.success)) {
							options.success(data, textStatus, xhr);
						}
					}).error(function (xhr, textStatus, thrownError) {
						if (options.key.indexOf('sendError') < 0) {
							ajaxExtend.options.log[options.key]['responseStatus'] = xhr.status;
							ajaxExtend.options.log[options.key]['responseText'] = xhr.responseText;
						}

						if ($.isFunction(options.error)) {
							options.error(xhr, textStatus, thrownError);
						}
					});

					formData = null;
					fileData = null;
				}
			} else {

				$.ajax({
					"url": options.url,
					"dataType": options.dataType,
					"processData": options.processData,
					"cache": options.cache,
					"type": options.type,
					"xhr": function () {
						var xhr = new window.XMLHttpRequest();

						/// Upload progress
						xhr.upload.addEventListener("progress", function (event) {
							var percent = 0;
							var position = event.loaded || event.position;
							/*event.position is deprecated*/
							var total = event.total;
							if (event.lengthComputable) {
								percent = Math.ceil(position / total * 100);
							}
							options.uploadProgress(event, options.key, position, total, percent);
							percent = null;
							total = null;
							position = null;
						}, false);

						/// Download progress
						xhr.addEventListener("progress", function (event) {
							var percent = 0;
							var position = event.loaded || event.position;
							/*event.position is deprecated*/
							var total = event.total;
							if (event.lengthComputable) {
								percent = Math.ceil(position / total * 100);
							}
							options.uploadProgress(event, options.key, position, total, percent);
							percent = null;
							total = null;
							position = null;
						}, false);
						return xhr;
					},
					"beforeSend": function (x) {
						ajaxExtend.options.processRunning = true;

						var i = 0;

						var key = options.key;
						/// Get unique key
						while (ajaxExtend.options.ajaxCalls[key] !== undefined) {
							key = options.key + i.toString();
							i++;
						}

						options.key = key;

						x['id'] = options.key;

						if ($.isFunction(options.beforeSend)) {
							options.beforeSend(x);
						}

						if (options.key.indexOf('sendError') < 0) {
							ajaxExtend.options.log[options.key] = {};
							ajaxExtend.options.log[options.key]['requestType'] = options.type;
							ajaxExtend.options.log[options.key]['requestUrl'] = options.url;
							ajaxExtend.options.log[options.key]['requestData'] = options.data;
						}

						ajaxExtend.options.ajaxCalls[options.key] = x;
						ajaxExtend.options.ajaxCallBacks[options.key] = options.abortCallback;

						if (options.authorisation) {
							/// Do authorisation request
							x.setRequestHeader('Authorization',  options.authorisationHeader);
						}

						var text = options.text;

						if (text == '') {
							text = options.key;
						}

						/// Start processing bar
						if (options.processing) {
							ajaxExtend.start(text, options.key, options.abort);
						}
						text = null;
						key = null;
					},
					"contentType": options.contentType,
					"data": options.data,
					"success": function (data, textStatus, xhr) {
						if (options.key.indexOf('sendError') < 0) {
							ajaxExtend.options.log[options.key]['responseData'] = data;
							ajaxExtend.options.log[options.key]['responseStatus'] = xhr.status;
							ajaxExtend.options.log[options.key]['responseText'] = xhr.responseText;
						}

						if( options.offlineCache == true ) {
							var storageKey = ajaxExtend.getStorageByValueObject({'url': options.url, 'params': options.data});
							if( storageKey != false ) {
								localStorage.setItem(storageKey, JSON.stringify({'data': data, 'url': options.url, 'params': JSON.parse(options.data)}) );
							}else{
								var storage = "offlineStorage" + ajaxExtend.options.offlineNo;
								ajaxExtend.options.offlineNo ++;
								localStorage.setItem(storage, JSON.stringify({'data': data, 'url': options.url, 'params': JSON.parse(options.data)}) );
							}
						}

						if ($.isFunction(options.success)) {
							options.success(data, textStatus, xhr);
						}

						$(document).trigger('ajaxExecute');
					},
					"complete": function (x) {
						/// Find correct call and remove corresponding processing bar
						$.each(ajaxExtend.options.ajaxCalls, function (key, value) {
							if (value['id'] !== undefined) {
								if (value['id'] == x['id']) {
									ajaxExtend.end(key);
								}
							}
						});

						if ($.isFunction(options.complete)) {
							options.complete(x);
						}
						defer.resolve();
					},
					"error": function (xhr, textStatus, thrownError) {
						if (options.key.indexOf('sendError') < 0) {
							ajaxExtend.options.log[options.key]['responseStatus'] = xhr.status;
							ajaxExtend.options.log[options.key]['responseText'] = xhr.responseText;
						}

						if( options.offlineCache == true ) {
							var storageKey = ajaxExtend.getStorageByValueObject({'url': options.url, 'params': options.data});
							if( storageKey != false ) {
								var storage = JSON.parse(localStorage.getItem(storageKey));
								if ($.isFunction(options.success)) {
									var newXhr = {
										"readyState": 4,
										"responseText": storage.data,
										"status": 200,
										"statusText": "OK"
									};
									options.success(storage.data, "success", newXhr);
								}
							}else{
								//You are offline and this dataset is not cached. Please Reconnect.
							}
						}else{
							//You are offline and this dataset is not cached. Please Reconnect.
						}

						if ($.isFunction(options.error)) {
							options.error(xhr, textStatus, thrownError);
						}
					}
				});
			}
			type = null;
			parseData = null;
		});
		defer.notify();
		return promise;
	},

	/// Settings for current call
	setExecute: function (object) {
		var defer = $.Deferred();
		var promise = defer.promise();
		promise.progress(function() {
			var options = ajaxExtend.options;
			var customCall = $.extend(true, {}, options);
			customCall = $.extend(true, customCall, object);

			ajaxExtend.doExecute(customCall).then(function(){
				defer.resolve();
			});
			customCall = null;
		});
		defer.notify();
		return promise;
	},

	/// Build select options
	buildOptions: function (array, element) {
		var options = ajaxExtend.options.customCall;

		if ($.isArray(array)) {

			/// For each array item
			for (var i = 0; i < array.length; i++) {
				var item = array[i];

				var type = 'option';
				var parentId = 0;

				if (item['type'] !== undefined) {
					type = item['type'];
				}

				if (item['parent'] !== undefined) {
					parentId = item['parent'];
				}

				/// Create option / optgroup
				var e = $(document.createElement(type));
				if (type == 'option') {
					e.attr('value', item['value']);
					e.html(item['name']);
				} else {
					e.attr({
						'data-value': item['value'],
						'label': item['name']
					});
				}

				if (type == 'option') {
					if (parentId == 0) {
						element.append(e);
					} else {
						element.find('optgroup').each(function () {
							if ($(this).attr('data-value') == parentId) {
								$(this).append(e);
							}
						});
					}
				} else {
					element.append(e);
				}
				type = null;
				parentId = null;
				e = null;
			}
		}
	},

	/// List
	list: function (element) {
		var options = ajaxExtend.options.customCall;

		$.ajax({
			"url": options.url,
			"dataType": options.dataType,
			"processData": options.processData,
			"cache": options.cache,
			"type": options.type,
			"xhr": function () {
				var xhr = new window.XMLHttpRequest();

				/// Upload progress
				xhr.upload.addEventListener("progress", function (event) {
					var percent = 0;
					var position = event.loaded || event.position;
					/*event.position is deprecated*/
					var total = event.total;
					if (event.lengthComputable) {
						percent = Math.ceil(position / total * 100);
					}
					options.uploadProgress(event, options.key, position, total, percent);
					percent = null;
					total = null;
					position = null;
				}, false);

				/// Download progress
				xhr.addEventListener("progress", function (event) {
					var percent = 0;
					var position = event.loaded || event.position;
					/*event.position is deprecated*/
					var total = event.total;
					if (event.lengthComputable) {
						percent = Math.ceil(position / total * 100);
					}
					options.uploadProgress(event, options.key, position, total, percent);
					percent = null;
					total = null;
					position = null;
				}, false);
				return xhr;
			},
			"beforeSend": function (x) {

				var i = 0;

				var key = options.key;
				/// Get unique key
				while (ajaxExtend.options.ajaxCalls[key] !== undefined) {
					key = options.key + i.toString();
					i++;
				}

				options.key = key;

				x['id'] = options.key;

				if ($.isFunction(options.beforeSend)) {
					options.beforeSend(x);
				}

				if (options.key.indexOf('sendError') < 0) {
					ajaxExtend.options.log[options.key] = {};
					ajaxExtend.options.log[options.key]['requestType'] = options.type;
					ajaxExtend.options.log[options.key]['requestUrl'] = options.url;
					ajaxExtend.options.log[options.key]['requestData'] = options.data;
				}

				ajaxExtend.options.ajaxCalls[options.key] = x;
				ajaxExtend.options.ajaxCallBacks[options.key] = options.abortCallback;

				if (options.authorisation) {
					/// Do authorisation request
					x.setRequestHeader('Authorization',  options.authorisationHeader);
				}

				var text = options.text;

				if (text == '') {
					text = options.key;
				}

				/// Start processing bar
				ajaxExtend.start(text, options.key, options.abort);
				key = null;
				text = null;
			},
			"uploadProgress": function (event, i, position, total, percentComplete) {
				if ($.isFunction(options.uploadProgress)) {
					options.uploadProgress(event, i, position, total, percentComplete);
				}
			},
			"contentType": options.contentType,
			"data": options.data,
			"success": function (data, textStatus, xhr) {
				if (options.key.indexOf('sendError') < 0) {
					ajaxExtend.options.log[options.key]['responseData'] = data;
					ajaxExtend.options.log[options.key]['responseStatus'] = xhr.status;
					ajaxExtend.options.log[options.key]['responseText'] = xhr.responseText;
				}

				if( options.offlineCache == true ) {
					var storageKey = ajaxExtend.getStorageByValueObject({'url': options.url, 'params': options.data});
					if( storageKey != false ) {
						localStorage.setItem(storageKey, JSON.stringify({'data': data, 'url': options.url, 'params': JSON.parse(options.data)}) );
					}else{
						var storage = "offlineStorage" + ajaxExtend.options.offlineNo;
						ajaxExtend.options.offlineNo ++;
						localStorage.setItem(storage, JSON.stringify({'data': data, 'url': options.url, 'params': JSON.parse(options.data)}) );
					}
				}

				if (typeof element == "object") {
					/// Remove all options / optgroups
					element.find('option').remove();
					element.find('optgroup').remove();

					if (xhr.status == 200) {
						ajaxExtend.buildOptions(data['results'], element);
					} else if (xhr.status == 204) {
						ajaxExtend.buildOptions([{"name": "No Results Found", "value": ""}], element);
					}
				}

				if ($.isFunction(options.success)) {
					options.success(data, textStatus, xhr)
				}

				$(document).trigger('ajaxListExecute');
			},
			"complete": function (x) {
				/// Find correct call and remove corresponding processing bar
				$.each(ajaxExtend.options.ajaxCalls, function (key, value) {
					if (value['id'] !== undefined) {
						if (value['id'] == x['id']) {
							ajaxExtend.end(key);
						}
					}
				});

				if ($.isFunction(options.complete)) {
					options.complete(x);
				}
			},
			"error": function (xhr, textStatus, thrownError) {
				if (options.key.indexOf('sendError') < 0) {
					ajaxExtend.options.log[options.key]['responseStatus'] = xhr.status;
					ajaxExtend.options.log[options.key]['responseText'] = xhr.responseText;
				}

				if( options.offlineCache == true ) {
					var storageKey = ajaxExtend.getStorageByValueObject({'url': options.url, 'params': options.data});
					if( storageKey != false ) {
						var storage = JSON.parse(localStorage.getItem(storageKey));
						if ($.isFunction(options.success)) {
							var newXhr = {
								"readyState": 4,
								"responseText": storage.data,
								"status": 200,
								"statusText": "OK"
							};
							options.success(storage.data, "success", newXhr);
						}
					}else{
						//You are offline and this dataset is not cached. Please Reconnect.
					}
				}else{
					//You are offline and this dataset is not cached. Please Reconnect.
				}

				if ($.isFunction(options.error)) {
					options.error(xhr, textStatus, thrownError);
				}
			}
		});
	},

	listExecute: function (object, element) {
		var options = ajaxExtend.options;

		var customCall = $.extend(true, {}, options);
		customCall = $.extend(true, customCall, object);
		var options = customCall;
		customCall = null;

		$.ajax({
			"url": options.url,
			"dataType": options.dataType,
			"processData": options.processData,
			"cache": options.cache,
			"type": options.type,
			"xhr": function () {
				var xhr = new window.XMLHttpRequest();

				/// Upload progress
				xhr.upload.addEventListener("progress", function (event) {
					var percent = 0;
					var position = event.loaded || event.position;
					/*event.position is deprecated*/
					var total = event.total;
					if (event.lengthComputable) {
						percent = Math.ceil(position / total * 100);
					}
					options.uploadProgress(event, options.key, position, total, percent);
					percent = null;
					total = null;
					position = null;
				}, false);

				/// Download progress
				xhr.addEventListener("progress", function (event) {
					var percent = 0;
					var position = event.loaded || event.position;
					/*event.position is deprecated*/
					var total = event.total;
					if (event.lengthComputable) {
						percent = Math.ceil(position / total * 100);
					}
					options.uploadProgress(event, options.key, position, total, percent);
					percent = null;
					total = null;
					position = null;
				}, false);
				return xhr;
			},
			"beforeSend": function (x) {

				var i = 0;

				var key = options.key;
				/// Get unique key
				while (ajaxExtend.options.ajaxCalls[key] !== undefined) {
					key = options.key + i.toString();
					i++;
				}

				options.key = key;

				x['id'] = options.key;

				if ($.isFunction(options.beforeSend)) {
					options.beforeSend(x);
				}

				if (options.key.indexOf('sendError') < 0) {
					ajaxExtend.options.log[options.key] = {};
					ajaxExtend.options.log[options.key]['requestType'] = options.type;
					ajaxExtend.options.log[options.key]['requestUrl'] = options.url;
					ajaxExtend.options.log[options.key]['requestData'] = options.data;
				}

				ajaxExtend.options.ajaxCalls[options.key] = x;
				ajaxExtend.options.ajaxCallBacks[options.key] = options.abortCallback;

				if (options.authorisation) {
					/// Do authorisation request
					x.setRequestHeader('Authorization',  options.authorisationHeader);
				}

				var text = options.text;

				if (text == '') {
					text = options.key;
				}

				/// Start processing bar
				ajaxExtend.start(text, options.key, options.abort);
				text = null;
				key = null;
			},
			"uploadProgress": function (event, i, position, total, percentComplete) {
				if ($.isFunction(options.uploadProgress)) {
					options.uploadProgress(event, i, position, total, percentComplete);
				}
			},
			"contentType": options.contentType,
			"data": options.data,
			"success": function (data, textStatus, xhr) {
				if (options.key.indexOf('sendError') < 0) {
					ajaxExtend.options.log[options.key]['responseData'] = data;
					ajaxExtend.options.log[options.key]['responseStatus'] = xhr.status;
					ajaxExtend.options.log[options.key]['responseText'] = xhr.responseText;
				}

				if( options.offlineCache == true ) {
					var storageKey = ajaxExtend.getStorageByValueObject({'url': options.url, 'params': options.data});
					if( storageKey != false ) {
						localStorage.setItem(storageKey, JSON.stringify({'data': data, 'url': options.url, 'params': JSON.parse(options.data)}) );
					}else{
						var storage = "offlineStorage" + ajaxExtend.options.offlineNo;
						ajaxExtend.options.offlineNo ++;
						localStorage.setItem(storage, JSON.stringify({'data': data, 'url': options.url, 'params': JSON.parse(options.data)}) );
					}
				}

				if (typeof element == "object") {
					/// Remove all options / optgroups
					element.find('option').remove();
					element.find('optgroup').remove();

					if (xhr.status == 200) {
						ajaxExtend.buildOptions(data['results'], element);
					} else if (xhr.status == 204) {
						ajaxExtend.buildOptions([{"name": "No Results Found", "value": ""}], element);
					}
				}

				if ($.isFunction(options.success)) {
					options.success(data, textStatus, xhr)
				}

				$(document).trigger('ajaxListExecute');
			},
			"complete": function (x) {
				/// Find correct call and remove corresponding processing bar
				$.each(ajaxExtend.options.ajaxCalls, function (key, value) {
					if (value['id'] !== undefined) {
						if (value['id'] == x['id']) {
							ajaxExtend.end(key);
						}
					}
				});

				if ($.isFunction(options.complete)) {
					options.complete(x);
				}
			},
			"error": function (xhr, textStatus, thrownError) {
				if (options.key.indexOf('sendError') < 0) {
					ajaxExtend.options.log[options.key]['responseStatus'] = xhr.status;
					ajaxExtend.options.log[options.key]['responseText'] = xhr.responseText;
				}

				if( options.offlineCache == true ) {
					var storageKey = ajaxExtend.getStorageByValueObject({'url': options.url, 'params': options.data});
					if( storageKey != false ) {
						var storage = JSON.parse(localStorage.getItem(storageKey));
						if ($.isFunction(options.success)) {
							var newXhr = {
								"readyState": 4,
								"responseText": storage.data,
								"status": 200,
								"statusText": "OK"
							};
							options.success(storage.data, "success", newXhr);
						}
					}else{
						//You are offline and this dataset is not cached. Please Reconnect.
					}
				}else{
					//You are offline and this dataset is not cached. Please Reconnect.
				}

				if ($.isFunction(options.error)) {
					options.error(xhr, textStatus, thrownError);
				}
			}
		});
	},

	/// Abort Call
	abort: function (key) {
		var options = ajaxExtend.options;

		if (key in options.ajaxCalls) {
			options.ajaxCalls[key].abort();
			var callback = options.ajaxCallBacks[key];

			if ($.isFunction(callback)) {
				callback();
			}

			ajaxExtend.end(key);
		}

		$(document).trigger('ajaxAbort');
	},

	/// Abort All Ajax calls
	abortAll: function () {
		var options = ajaxExtend.options;

		$.each(options.ajaxCalls, function (key, value) {
			ajaxExtend.abort(key);
		});
		$(document).trigger('ajaxAbortAll');
	},

	/// Start Processing
	start: function (text, val, abort) {
		var options = ajaxExtend.options;

		clearTimeout(options.timeout);

		ajaxExtend.show();

		templateEngine.load(ajaxExtend.options.progressTemplate, {"text": text, "id": 'processing-progress_' + val, 'buttonId': "processing-cancel-" + val}, $('#' + ajaxExtend.options.templateConfig.bodyId)).then(function() {

			if (typeof text === 'undefined') {
				text = '';
			}

			$('#' + 'processing-progress_' + val + ' div')
				.css({
					'width': '100%'
				});

			if (!abort) {
				/// Hide cancel button if cannot abort
				$('#' + 'processing-cancel-' + val).hide();
			}

			$(document).trigger('ajaxStart');
		});
	},

	/// Remove processing request
	end: function (i) {
		var options = ajaxExtend.options;

		/// Remove call from calls object
		delete options.ajaxCalls[i];

		ajaxExtend.complete(i);
		$(document).trigger('ajaxEnd');
	},

	/// Remove processing bar
	complete: function (i) {
		/// Remove processing bar
		if ($('#processing-progress_' + i).length > 0) {
			$('#processing-progress_' + i).remove();
		}

		$(document).trigger('ajaxComplete');
	},

	destroy: function () {
		$('#' + ajaxExtend.options.templateConfig.dialogId).remove();
	},

	serializeObject: function (element) {
		var o = {};
		var disabledArray = [];

		element.find(':disabled').each(function () {
			disabledArray.push($(this));
			$(this).removeAttr('disabled');
		});

		var a = element.serializeArray();
		$.each(a, function () {
			if (o[this.name] !== undefined) {
				if (!o[this.name].push) {
					o[this.name] = [o[this.name]];
				}
				o[this.name].push(this.value || '');
			} else {
				o[this.name] = this.value || '';
			}
		});

		$.each(disabledArray, function (key, value) {
			value.attr('disabled', 'disabled');
		});
		disabledArray = null;

		return o;
		o = null;
	},

	getLog: function () {
		return ajaxExtend.options.log;
	},

	getOpen: function() {
		var self = this;
		var options = this.options;
		return options.processRunning;
	},

	getStorageByValueObject: function ( value ) {
		var self = this;
		var options = this.options;

		var storage = localStorage;
		for (var i = 0; i < storage.length; i++){
			var storageValue = storage.getItem(storage.key(i));
			var tempValue = {};


			if( storageValue.indexOf('{') > -1 && typeof(value) == "object" ) {
				storageValue = JSON.parse(storageValue);
				$.each(value, function(k, v){
					$.each(storageValue, function(ke, va){
						if( k == ke ) {
							tempValue[k] = va;
						}
					});
				});
			}

			if( JSON.stringify(tempValue) === JSON.stringify(value)  ){
				return storage.key(i);
			}
		}
		return false;
	}
};