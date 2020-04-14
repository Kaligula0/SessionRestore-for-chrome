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
			clog($result);
		}
	);

	readStorage();
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
				+ '<p class="date">'
				+ '<a href="#" class="session_'+$i+'">'
				+ $date.toLocaleString() + '</a><br />'
				+ '<small>'
				+ $windows_l + ' window' + ($windows_l==1?'':'s')
				+ ', ' + $tabsSum + ' tab' + ($tabsSum==1?'':'s')
				+ '</small>'
				+ '</p>'
				+ $mainList;

		}
	);
	
	document.querySelector('#mainTable tbody td.mainList').innerHTML = $mainList
	
	showSessionDetails();
}

function showSessionDetails($id=$sessions.length-1){
	//last session by default
	if ($id==-1) return; //if no sessions
	
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
			+ '<h2> » Window #' + ($i+1) + ($el.incognito?' (Incognito) – ':' – ') + $el.tabs.length + ' tabs</h2>'
			+ '<ul>';
		
		$el.tabs.forEach(function($tab, $j, $arr){
			$sessionDetails = $sessionDetails
				+ '<li><img class="favicon" src="'+($tab.favIconUrl?$tab.favIconUrl:'/images/1x1.png')+'"> '
				+ '<a href='+encodeURI($tab.url)+'" target="_blank">'
				+ ($tab.title.length>100?$tab.title.substring(0,100)+'…':$tab.title)
				+ '</a>'
				+ '</li>';
		})

		$sessionDetails = $sessionDetails
			+ '</ul>';

	})
	
	document.querySelector('#mainTable tbody td.details').innerHTML = $sessionDetails;	

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