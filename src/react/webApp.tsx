import {PasswordDialog} from "./components/passwordDialog";
import {Menu} from "./components/menu";
import "./styles.css";

export default function WebApp() {
    document.addEventListener('promptpassword', () => {
        const password = document.querySelector('#password');
        if (password) {
            (password as HTMLInputElement).style.display = 'block';
        }
    });
    return (
        <div>
            <Menu/>
            <PasswordDialog/>
        </div>
    )
}
