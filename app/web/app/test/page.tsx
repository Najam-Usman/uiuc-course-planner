export default function Test() {

    const styles = {

        mydiv : {
            height : 200,
            width : 200,
            paddingLeft: 100,
        },     
    };

    const pattern = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%239C92AC' fill-opacity='0.4' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`;

    return (
        <section className="relate min-h-[50vh]"
            style={{
                backgroundColor: "#eae3dd",
                backgroundImage : pattern,
                backgroundRepeat : "repeat",
                backgroundSize : "4px 4px"
            }}
        >

            <div style={styles.mydiv}>
                <h1>Hello</h1>
            </div>
        </section>
    );
}
