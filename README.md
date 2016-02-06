# ajaxExtend
An extension to jQuery's ajax engine, with api key support, image upload support, offline storage for apps and processing dialog

Full Documentation and examples are available at [moridiweb.com](http://moridiweb.com/ajaxExtend.html).

```javascript
<script src="jQuery.ajaxExtend.js"></script>
```

```javascript
ajaxExtend.setExecute({
	"url": 'templates/row.html',
	"key": 'keyName',
	"text": "Retrieving Template",
	"processing": false,
	"dataType": 'html',
	"contentType": "text/html",
	"success": function (data, textStatus, xhr) {
		if(xhr.status == 200) {
			doSomething(data);
		}
	}
});
```

If you require a processing dialog, you will need to set the theme, depending on your chosen css framework.

```javascript
<script src="template.js"></script>
```

```javascript
<script src="jQuery.ajaxExtend.js"></script>
```

```javascript
ajaxExtend.options.theme = "bootstrap";
ajaxExtend.options.theme = "materialize";
ajaxExtend.create().then(function(){
    ajaxExtend.setExecute({
    	"url": 'templates/row.html',
    	"key": 'keyName',
    	"text": "Retrieving Template",
    	"processing": false,
    	"dataType": 'html',
    	"contentType": "text/html",
    	"success": function (data, textStatus, xhr) {
    		if(xhr.status == 200) {
    			doSomething(data);
    		}
    	}
    });
});
```