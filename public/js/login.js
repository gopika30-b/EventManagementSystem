document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        
        const formData = new FormData(loginForm);
        const formObject = {};
        
        formData.forEach((value, key) => {
            formObject[key] = value;
        });
        
        const response = await fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formObject)
        });
        
        const responseData = await response.json();
        
        if (response.ok) {
            if (responseData.redirect) {
                window.location.href = responseData.redirect; // Redirect to specified URL
            } else {
                alert("Login successful!");
            }
        } else {
            alert(responseData.error);
        }
    });
});
