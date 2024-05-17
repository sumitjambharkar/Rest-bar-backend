const showUser = async () => {
    let list = "";
    try {
        const result = await axios.get("http://localhost:3002/show-users");
        console.log(result.data);
        result.data.forEach((doc) => {
            list += `<div class="box">
                <div class="user">
                    <span>Email: ${doc.email}</span><br>
                    <span>Status: ${doc.status}</span>
                    <div class="space"><button onclick='deleteUser("${doc._id}")' class="cancelled">Delete</button>`;
            
            if (doc.status === "Active") {
                list += `<button onclick='approve({ status: "inActive", id: "${doc._id}" })' class="cancelled">Unapprove</button>`;
            } else {
                list += `<button onclick='approve({ status: "Active", id: "${doc._id}" })' class="approve">Approve</button>`;
            }
            
            list += `</div>
                </div>
            </div>`;
        });
        
        document.querySelector(".section").innerHTML = list;
    } catch (error) {
        console.log(error);
    }
};

showUser();

const approve = async ({ status, id }) => {
    try {
        const result = await axios.put(`https://rest-bar-backend.onrender.com/update/user`, { status: status,id:id });
        console.log(result);
        showUser();
    } catch (error) {
        console.log(error);
    }
};

const deleteUser =async (id) => {
    console.log(id);
    try {
        const result = await axios.delete(`https://rest-bar-backend.onrender.com/delete/user/${id}`);
        console.log(result);
        showUser();
    } catch (error) {
        console.log(error);
    }
}