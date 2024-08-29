export default function EditDataModal({currentDb}) {
    if (currentDb) {

        return (
            <div>
                <h1>Edit Data</h1>
                <form>
                    <label htmlFor="name">Name</label>
                    <input type="text" id="name" name="name"/>
                    <label htmlFor="value">Value</label>
                    <input type="text" id="value" name="value"/>
                    <button type="submit">Save</button>
                </form>
            </div>
        )
    } else {
        return <h1>Nothing Selected</h1>
    }
}