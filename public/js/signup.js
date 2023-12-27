document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.getElementById("signupForm");
    
    signupForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        
        const formData = new FormData(signupForm);
        const formObject = {};
        
        formData.forEach((value, key) => {
            formObject[key] = value;
        });
        
        if (formObject.psw !== formObject.confirmPsw) {
            alert("Passwords do not match.");
            return;
        }
        
        const response = await fetch("/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formObject) // Convert to JSON
        });
        const responseData = await response.json(); // Parse JSON response
        
        if (response.ok) {
            // Account created successfully, handle it
            alert("Account created successfully! You can now log in.");
            window.location.href = "/login"; // Redirect to login page
        } else {
            alert(responseData.error); // Display the error message using alert
        }
    });
});
