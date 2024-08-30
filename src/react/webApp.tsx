import "./styles.css";
import '@mantine/core/styles.css';
import React from "react";
import {RouterProvider} from "react-router-dom";
import {webRouter} from "./webRouter";
import {Auth0Provider} from "@auth0/auth0-react";

export default function WebApp() {
    document.addEventListener('promptpassword', () => {
        const password = document.querySelector('#password');
        if (password) {
            (password as HTMLInputElement).style.display = 'block';
        }
    });

    return (
        <Auth0Provider
            domain="dev-g0lt18ndbcp6earr.us.auth0.com"
            clientId="3l9HFxOIotk2QbJbdmLoI7lgCjsSUt2j"
            authorizationParams={{
                redirect_uri: window.location.origin
            }}>
            <RouterProvider router={webRouter}/>
        </Auth0Provider>
    )
}
