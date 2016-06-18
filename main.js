window.onload = function () {
    // Handle .hamburger
    var hamburger = document.querySelector(".hamburger");
    hamburger.addEventListener("click", function () {
        hamburger.classList.toggle("is-active");
    });

    var navLink = document.querySelector(".navLink");
    navLink.addEventListener("click", function () {
        navLink.classList.toggle("is-selected");
    });
}
