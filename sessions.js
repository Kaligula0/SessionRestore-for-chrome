function start() {
	// check if there are already sessions in storage, if not then create empty
	chrome.storage.local.get(
		'sessions',
		function($result){
			if (Object.keys($result).length==0) //$result={} instead of {sessions: […]}
				chrome.storage.local.set(
					{
						sessions: "[]"
					}
				);
		}
	);

	// check if there are already sessions in storage, if not then create default
	// if yes then read
	chrome.storage.local.get(
		'interval',
		function($result){
			if (Object.keys($result).length==0) //$result={} instead of {sessions: […]}
				$result="300"; // [SEC]; DEFAULT 5 MINS
			$result=(typeof $result=='object'?$result['interval']:$result);
			window.$interval = JSON.parse($result);
			document.querySelector('#mainTable td.settings input[name="interval"]').value = JSON.parse($result);
		}
	);
	chrome.storage.local.get(
		'quotaOverload',
		function($result){
			if (Object.keys($result).length==0) //$result={} instead of {sessions: […]}
				$result="false"; // DEFAULT NOT TO EXCEED 90%
			$result=(typeof $result=='object'?$result['quotaOverload']:$result);
			window.$quotaOverload = JSON.parse($result);
			document.querySelector('#mainTable td.settings input[name="quotaOverload"]').checked = JSON.parse($result);
		}
	);
	chrome.storage.local.get(
		'quotaMax',
		function($result){
			if (Object.keys($result).length==0) //$result={} instead of {sessions: […]}
				$result="20"; // DEFAULT 20%
			$result=(typeof $result=='object'?$result['quotaMax']:$result);
			window.$quotaMax = JSON.parse($result);
			document.querySelector('#mainTable td.settings input[name="quotaMax"]').value = JSON.parse($result);
		}
	);

	readStorage();

	document.querySelectorAll('#mainTable td.settings input').forEach(
		function($el, $i, $arr){
			$el.addEventListener(
				'input',
				function () {
					if (this.name=="quotaOverload") {
						$quotaOverload = this.checked;
						chrome.storage.local.set({quotaOverload: this.checked});
						alert("Saved!");
					} else if (this.name=="quotaMax") {
						this.value = +this.value.replace(/[^\d]+/g,'');
						if (this.value>90) {
							if (!$quotaOverload) {
								this.value = 90;
							} else {
								if (this.value>100)
									this.value = 100;
							}
						}
						chrome.storage.local.set({quotaMax: this.value});
					} else if (this.name=="interval") {
						this.value = +this.value.replace(/[^\d]+/g,'');
						if (this.value<1) {
							this.value = 1;
						}
						chrome.storage.local.set({interval: this.value});
					}
				}
			);
		}
	);
	document.querySelectorAll('#mainTable td.settings input').forEach(
		function($el, $i, $arr){
			$el.addEventListener(
				'change',
				function () {
					if (this.name=="quotaMax") {
						chrome.storage.local.set({quotaMax: this.value});
						alert("Saved!");
					} else if (this.name=="interval") {
						chrome.storage.local.set({interval: this.value});
						alert("Saved!");
					}
				}
			);
		}
	);

}

var $sessions;

function readStorage(){
	chrome.storage.local.get(
		'sessions',
		function($result){
			$result=(typeof $result=='object'?$result['sessions']:$result);
			$sessions=JSON.parse($result);
			
			buildSessionList();
		}
	);
}

function buildSessionList(){
	
	/* THEAD */
	// number of sessions
	document.querySelector('#mainTable th.mainList .number').innerHTML = $sessions.length;
	
	var $mainList = '';
	
	$sessions.forEach(
		function($el, $i, $arr){
			
			var $date = $el.date;
			$date = new Date($date);
			
			var $windows = $el.windows;
			var $windows_l = $el.windows.length;
			var $tabsSum = '';
			$windows.forEach(
				function($w, $j){
					$tabsSum = $tabsSum + ($j==0?'':'+') + $w.tabs.length;
				}
			);

			$mainList = ''
				+ '<p class="date session_'+$i+'">'
				+ '<a class="sessionLink session_'+$i+'">'
				+ $date.toLocaleString() + '</a><br />'
				+ '<small>'
				+ $windows_l + ' window' + ($windows_l==1?'':'s')
				+ ', ' + $tabsSum + ' tab' + ($tabsSum==1?'':'s')
				+ '</small>'
				+ '<small><a class="removeLink session_'+$i+'" title="Remove session">[X]</small>'
				+ '</p>'
				+ $mainList;

		}
	);
	
	document.querySelector('#mainTable tbody td.mainList').innerHTML = $mainList;

	document.querySelectorAll('#mainTable td.mainList p.date a.sessionLink').forEach(
		function($el, $i, $arr){
			$el.addEventListener(
				'click',
				function () {
					showSessionDetails(+this.className.match(/session_(\d+)/)[1]);
				}
			);
		}
	);

	document.querySelectorAll('#mainTable td.mainList p.date a.removeLink').forEach(
		function($el, $i, $arr){
			$el.addEventListener(
				'click',
				function () {
					removeSession(+this.className.match(/session_(\d+)/)[1]);
				}
			);
		}
	);

	showSessionDetails();
}

function showSessionDetails($id=$sessions.length-1){
	//last session by default
	if ($id<0) return; //if no sessions
	
	var $a = document.querySelector('#mainTable td.mainList p.date.active');
	if ($a!=null)
		$a.className = $a.className.replace(' active','');
	document.querySelector('#mainTable td.mainList p.date.session_'+$id).className += ' active';
	
	var $date = $sessions[$id].date;
	$date = new Date($date);
	
	var $windows = $sessions[$id].windows;
	var $windows_l = $sessions[$id].windows.length;
	var $tabsSum = '';
	$windows.forEach(
		function($w, $j){
			$tabsSum = $tabsSum + ($j==0?'':'+') + $w.tabs.length;
		}
	);
	
	var $sessionDetails = '';
	$sessionDetails = $sessionDetails
		+ '<h1>' + $date.toLocaleString()
		+ '<small> → '
		+ $windows_l + ' window' + ($windows_l==1?'':'s')
		+ ', ' + $tabsSum + ' tab' + ($tabsSum==1?'':'s')
		+ '</small></h1>';
	
	$windows.forEach(function($el, $i, $arr){
		$sessionDetails = $sessionDetails
			+ '<h2 class="session_'+$id+'"> » Window #' + ($i+1) + ($el.incognito?' (Incognito) – ':' – ') + $el.tabs.length + ' tabs '
			+ '<small>→ <a class="session_'+$id+' openall window_'+($i)+'" title="Open new window with all these tabs">[open all]</a></small></h2>'
			+ '<ul>';
		
		$el.tabs.forEach(function($tab, $j, $arr){
			$sessionDetails = $sessionDetails
				+ '<li><img class="favicon" src="'+($tab.favIconUrl?$tab.favIconUrl:'/images/1x1.png')+'"> '
				+ '<a href='+encodeURI($tab.url)+'" target="_blank">'
				+ ($tab.title.length>100?$tab.title.substring(0,100)+'…':$tab.title)
				+ '</a>'
				+ '</li>';
		});

		$sessionDetails = $sessionDetails
			+ '</ul>';

	})
	
	document.querySelector('#mainTable tbody td.details').innerHTML = $sessionDetails;	

	document.querySelectorAll('#mainTable tbody td.details h2 a.openall').forEach(
		function($el, $i, $arr){
			$el.addEventListener(
				'click',
				function () {
					var $s = +this.className.match(/session_(\d+)/)[1];
					var $w = +this.className.match(/window_(\d+)/)[1];
					openall( $sessions[$s].windows[$w] );
				}
			);
		}
	);

}

function openall($elem){
/*
focused: true
height: 908
incognito: false
left: -4
state: "maximized"
	The minimized, maximized and, fullscreen states cannot be combined with left, top, width, or height.
top: -4
type: "normal"
url:
width: 1608
*/
	clog($elem);

	//$elem.tabs[].url
	$urls=[];
	$elem.tabs.forEach(
		function ($el, $i, $arr){
			$urls.push($el.url);
		}
	);
	
	var $obj = {
		incognito:	$elem.incognito,
		state:		$elem.state,
		type:		$elem.type,
		url:		$urls
	}

	// The minimized, maximized and fullscreen states cannot be combined with left, top, width, or height.
	if ($elem.state=="normal") {
		$obj.focused = $elem.focused;
		$obj.height = $elem.height;
		$obj.left = $elem.left;
		$obj.top = $elem.top;
		$obj.width = $elem.width;
	}
clog($obj);
	chrome.windows.create($obj);
}

function removeSession($id) {
	clog($id);
	$sessions.splice($id, 1);
	chrome.storage.local.set(
		{
			sessions: JSON.stringify($sessions)
		}
	);
	document.querySelector('#mainTable td.mainList p.session_'+$id).remove();
}

/*
 *  console.log() with time on line beginning
 */
function clog($txt,$type){
	$type=($type||'info');
	var $date=new Date();
	var $ms = $date.getMilliseconds();
	$ms = $ms<100 ? ($ms<10?($ms==0?'000':'00'+$ms):'0'+$ms) : $ms ;
	return console[$type]( //default: console.info('…');
		'['+$date.toLocaleTimeString()+'.'+$ms+']',
		$txt
	);
}

window.onload=start;