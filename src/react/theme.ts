import {createTheme, MantineColorsTuple} from "@mantine/core";

const myColor: MantineColorsTuple = [
    '#fdfce5',
    '#f8f6d3',
    '#f0ecaa',
    '#e7e17c',
    '#e0d957',
    '#dbd33e',
    '#d9d02f',
    '#c0b820',
    '#aaa316',
    '#938c03'
];
export const theme = createTheme({
    colors: {
        myColor
    },
    breakpoints: {
        xs: '30em',
        sm: '54em',
        md: '64em',
        lg: '74em',
        xl: '90em',
    },
    primaryShade: 5,
    autoContrast: true,
    defaultRadius: 'md',
    primaryColor: 'myColor',
    /* Put your mantine themeM override here */
});

