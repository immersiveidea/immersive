import axios from "axios";

export function CreateMenu({display, toggleCreateMenu}) {
    const onCreateClick = (evt) => {
        evt.preventDefault();
        const name = (document.querySelector('#createName') as HTMLInputElement).value;
        let password = (document.querySelector('#createPassword') as HTMLInputElement).value;
        const password2 = (document.querySelector('#createPassword2') as HTMLInputElement).value;
        if (password !== password2) {
            window.alert('Passwords do not match');
            return;
        }

        const id = window.crypto.randomUUID().replace(/-/g, '_');
        if (password.length == 0) {
            password = id;
        }
        const encrypted = (password != id);

        localStorage.setItem(id, name);
        if (name && name.length > 4) {
            axios.post(import.meta.env.VITE_CREATE_ENDPOINT,
                {
                    "_id": "org.couchdb.user:" + id,
                    "name": id,
                    "password": password,
                    "roles": ["readers"],
                    "type": "user"
                }
            ).then(response => {
                console.log(response);
                const evt = new CustomEvent('dbcreated', {
                    detail: {
                        id: id,
                        name: name,
                        password: password,
                        encrypted: encrypted
                    }
                });
                document.dispatchEvent(evt);

            }).catch(error => {
                console.error(error);
            });


        } else {
            window.alert('Name must be longer than 4 characters');
        }
    }
    return (
        <div className="overlay" id="create" style={{'display': display}}>
            <div>
                <div>
                    <label htmlFor="createName">Diagram Name</label>
                    <input id="createName" placeholder="Enter a name for your diagram" type="text"/></div>
                <div>
                    <label htmlFor="createPassoword">Optional Password</label>
                    <input id="createPassword" placeholder="(Optional) Password" type="password"/>
                </div>
                <div>
                    <label htmlFor="createPassword2">Repeat Password</label>
                    <input id="createPassword2" placeholder="(Optional) Password" type="password"/></div>
                <div><a href="#" id="createActionLink" onClick={onCreateClick}>Create</a></div>
                <div><a className="cancel" onClick={toggleCreateMenu} href="#" id="cancelCreateLink">Cancel</a></div>
            </div>
        </div>
    )
}
