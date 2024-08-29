import PageTemplate from "../pageTemplate";
import {GiphyFetch} from "@giphy/js-fetch-api";
import {useEffect, useState} from "react";
import {Gif} from "@giphy/react-components";
import {Anchor, Center} from "@mantine/core";
import {Link} from "react-router-dom";

const gf = new GiphyFetch('J5elM5Q9k2xlqbSgt9nxdaVMOpRDgspL');

// React Component


export default function NotFound() {
    const [gif, setGif] = useState(null);
    const renderImage = () => {
        return gif ? <Gif gif={gif} width={200}/> : null
    };
    useEffect(() => {
        gf.gif('l2JJKs3I69qfaQleE').then((gif) => {
            console.log(gif);
            setGif(gif.data);
        });
    }, [])
    if (!gif) {
        return (
            <PageTemplate>
                <div>
                    <h1>404 Not Found</h1>

                    <p>Sorry, the page you are looking for does not exist.</p>
                </div>
            </PageTemplate>
        )
    }
    return (
        <PageTemplate>

            <h1>This is not the page you're looking for</h1>
            <Center>
                <Anchor component={Link} to="/">


                    <Gif noLink={true} backgroundColor='#000000' gif={gif} width={800}/>

                </Anchor>
            </Center>

            <Center></Center>

        </PageTemplate>
    );
}