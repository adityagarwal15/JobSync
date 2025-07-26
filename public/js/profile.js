document.addEventListener("DOMContentLoaded", () => {
    const username = localStorage.getItem("username") || "Guest";
    const email = localStorage.getItem("email") || "guest@example.com";
    const resumeFile = localStorage.getItem("resume");

    document.getElementById("username").textContent = username;
    document.getElementById("email").textContent = email;

    if (resumeFile) {
        document.getElementById("resume-placeholder").innerHTML = 
            `<a href="${resumeFile}" target="_blank" class="resume-link">View Resume</a>`;
    }

    document.getElementById("upload-btn").addEventListener("click", () => {
        const fileInput = document.getElementById("resume-upload").files[0];
        if (fileInput) {
            const fileURL = URL.createObjectURL(fileInput);
            localStorage.setItem("resume", fileURL);
            document.getElementById("resume-placeholder").innerHTML = 
                `<a href="${fileURL}" target="_blank" class="resume-link">View Resume</a>`;
        }
    });

    document.getElementById("logout-btn").addEventListener("click", () => {
        localStorage.clear();
        alert("Logged out!");
        window.location.reload();
    });

    // GSAP Animations: Add animation on page load
    gsap.to(".profile-container", { opacity: 1, y: 0, duration: 1, ease: "power4.out" });

    gsap.to("header h1", { opacity: 1, y: 0, duration: 1, delay: 0.3, ease: "power4.out" });
    gsap.to(".profile-details", { opacity: 1, y: 0, duration: 1, delay: 0.6, ease: "power4.out" });
    gsap.to(".resume-section", { opacity: 1, y: 0, duration: 1, delay: 0.9, ease: "power4.out" });

    // Hover Effect: Button hover animations using GSAP
    const buttons = document.querySelectorAll("button");
    buttons.forEach((btn) => {
        btn.addEventListener("mouseenter", () => {
            gsap.to(btn, { scale: 1.1, boxShadow: "0 15px 60px rgba(0, 0, 0, 0.4)", duration: 0.3 });
        });
        btn.addEventListener("mouseleave", () => {
            gsap.to(btn, { scale: 1, boxShadow: "0 12px 50px rgba(0, 0, 0, 0.4)", duration: 0.3 });
        });
    });
});
