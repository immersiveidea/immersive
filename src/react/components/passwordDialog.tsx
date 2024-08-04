export function PasswordDialog() {
    const onsubmitClick = (evt) => {
        evt.preventDefault();
        const password = (document.querySelector('#passwordInput') as HTMLInputElement).value;
        if (password.length < 4) {
            window.alert('Password must be longer than 4 characters');
        } else {
            const event = new CustomEvent('passwordset', {detail: password});
            document.dispatchEvent(event);
            (document.querySelector('#password') as HTMLInputElement).style.display = 'none';
        }
    }
    const onCancelClick = (evt) => {
        evt.preventDefault();
        (document.querySelector('#password') as HTMLInputElement).style.display = 'none';
    }
    return (
        <div className="overlay" id="password">
            <div>
                <div><input autoComplete="on" id="passwordInput" placeholder="Enter password" type="password"/></div>
                <div><a href="#" id="passwordActionLink" onClick={onsubmitClick}>Enter</a></div>
                <div><a className="cancel" href="#" onClick={onCancelClick} id="cancelPasswordLink">Cancel</a></div>
            </div>
        </div>
    )
}