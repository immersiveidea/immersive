const uploadImage = async (evt) => {

    const file = (evt.target as HTMLInputElement).files[0];
    const formData = new FormData();
    formData.append('file', file);
    //formData.append('requireSignedURLs', 'true');
    const formInitData = new FormData();
    formInitData.append('requireSignedURLs', 'true');

    const initialUpload = await fetch('/api/images', {
        method: 'POST',
        body: formInitData


    });
    try {
        const initialData = await initialUpload.json();
        if (initialData.success == true) {
            const upload = await fetch(initialData.result.uploadURL, {
                method: 'POST', mode: 'cors', body:
                formData
            });
            const uploadData = await upload.json();
            console.log(uploadData)
            for (let variant of uploadData.result.variants) {
                if (variant.indexOf('fullhd') > -1) {
                    const uploadEvent = new CustomEvent('uploadImage', {
                        detail: {
                            name: file.name,
                            data: variant
                        }
                    });
                    document.dispatchEvent(uploadEvent);
                    evt.target.remove();
                    console.log(variant);
                }
            }
        }
    } catch (err) {
        console.error(err);
    }
}
export {uploadImage};