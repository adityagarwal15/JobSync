// Add this at the beginning of the file
window.openChatbot = function() {
    const chatUI = document.getElementById('chatUI');
    if (chatUI) {
        chatUI.style.display = chatUI.style.display === 'none' || chatUI.style.display === '' ? 'flex' : 'none';
    }
};

// Add this after your window.openChatbot function
document.addEventListener('DOMContentLoaded', function() {
    const chatbotIcon = document.getElementById('chatbotIcon');
    if (chatbotIcon) {
        chatbotIcon.addEventListener('click', openChatbot);
    }
});

var $messages = $('.messages-content'),
    d, h, m,
    i = 0;

$(document).ready(function() {
    // Initialize chat only after document is ready
    $messages.mCustomScrollbar();
    setTimeout(function() {
        fakeMessage();
    }, 100);

    // Add click handler for message submit
    $('.message-submit').click(function() {
        insertMessage();
    });

    // Add keydown handler for enter key
    $(window).on('keydown', function(e) {
        if (e.which == 13) {
            insertMessage();
            return false;
        }
    });
});

function updateScrollbar() {
  $messages.mCustomScrollbar("update").mCustomScrollbar('scrollTo', 'bottom', {
    scrollInertia: 10,
    timeout: 0
  });
}

function setDate(){
  d = new Date()
  if (m != d.getMinutes()) {
    m = d.getMinutes();
    $('<div class="timestamp">' + d.getHours() + ':' + m + '</div>').appendTo($('.message:last'));
  }
}

function insertMessage() {
  msg = $('.message-input').val();
  if ($.trim(msg) == '') {
    return false;
  }
  $('<div class="message message-personal">' + msg + '</div>').appendTo($('.mCSB_container')).addClass('new');
  setDate();
  $('.message-input').val(null);
  updateScrollbar();
  setTimeout(function() {
    fakeMessage();
  }, 1000 + (Math.random() * 20) * 100);
}

var Fake = [
  'Hi there, I\'m Aditya and you?',
  'Nice to meet you',
  'How are you?',
  'Not too bad, thanks',
  'What do you do?',
  'That\'s awesome',
  'Jobsync is a nice place to stay',
  'I think you\'re a nice person',
  'Why do you think that?',
  'Can you explain?',
  'Anyway I\'ve gotta go now',
  'It was a pleasure chat with you',
  'Time to make a new job recommendation',
  'Bye',
  ':)'
]

function fakeMessage() {
  if ($('.message-input').val() != '') {
    return false;
  }
  $('<div class="message loading new"><figure class="avatar"><img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/156381/profile/profile-80.jpg" /></figure><span></span></div>').appendTo($('.mCSB_container'));
  updateScrollbar();

  setTimeout(function() {
    $('.message.loading').remove();
    $('<div class="message new"><figure class="avatar"><img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/156381/profile/profile-80.jpg" /></figure>' + Fake[i] + '</div>').appendTo($('.mCSB_container')).addClass('new');
    setDate();
    updateScrollbar();
    i++;
  }, 1000 + (Math.random() * 20) * 100);

}