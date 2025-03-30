jQuery(document).ready(function ($) {


    // Here You can type your custom JavaScript...

    var header = document.getElementById("site-navigation");
    var masthead = document.getElementById("masthead");
    var body = document.querySelector("body");
    if (header) {


        // window.onscroll = function () {
        //     myFunction()
        // };

        var stickyheight = header.offsetHeight;
        var sticky = header.offsetTop + stickyheight;
        function myFunction() {

            if (window.pageYOffset > sticky) {
                header.classList.add("aft-sticky-navigation");
            } else {
                header.classList.remove("aft-sticky-navigation");
            }

            if (header.classList.contains("aft-sticky-navigation")) {
                masthead.style.paddingBottom = stickyheight + "px";
            } else {
                masthead.style.paddingBottom = 0;
            }
        }
    }


    var didScroll;
    var lastScrollTop = 0;
    var delta = 5;
    var navbarHeight = $('#site-navigation').outerHeight();

    $(window).on('scroll', function (event) {
        didScroll = true;
    });

    setInterval(function () {
        if (didScroll) {
            hasScrolled();
            didScroll = false;
        }
    }, 250);

    function hasScrolled() {
        var st = $(this).scrollTop();

        // Make sure they scroll more than delta
        if (Math.abs(lastScrollTop - st) <= delta)
            return;

        // If they scrolled down and are past the navbar, add class .nav-up.
        // This is necessary so you never see what is "behind" the navbar.
        if (st > lastScrollTop && st > navbarHeight) {
            // Scroll Down
            if (body.classList.contains("scrolldown-sticky-header") || body.classList.contains("scrollboth-sticky-header")) {
                myFunction();
                $('#site-navigation').removeClass('nav-down').addClass('nav-up');
            } else {
                $('#site-navigation').removeClass('nav-down').addClass('nav-up');
            }

        } else {
            // Scroll Up

            if (st + $(window).height() < $(document).height()) {
                if (header)
                {
                    myFunction();
                    $('#site-navigation').removeClass('nav-up').addClass('nav-down');
                }
                


            }
        }
        lastScrollTop = st;
    }

});