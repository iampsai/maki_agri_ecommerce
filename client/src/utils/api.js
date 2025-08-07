import axios from "axios";

const token=localStorage.getItem("token");

const params={
    headers: {
        'Authorization': `Bearer ${token}`, // Include your API key in the Authorization header
        'Content-Type': 'application/json', // Adjust the content type as needed
      },

} 

export const fetchDataFromApi = async (url) => {
    try {
        const { data } = await axios.get(process.env.REACT_APP_BASE_URL + url,params)
        return data;
    } catch (error) {
        console.log(error);
        return [];
    }
}


export const uploadImage = async (url, formData) => {
    try {
        const { data } = await axios.post(process.env.REACT_APP_BASE_URL + url, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data', // Important for file uploads
            }
        });
        return data;
    } catch (error) {
        console.error('Upload error:', error);
        throw error; // Rethrow to handle in the component
    }
}

export const postData = async (url, formData) => {

    try {
        const response = await fetch(process.env.REACT_APP_BASE_URL + url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`, // Include your API key in the Authorization header
                'Content-Type': 'application/json', // Adjust the content type as needed
              },
           
            body: JSON.stringify(formData)
        });


      

        // First check if response is ok before trying to parse JSON
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            // For error responses, first try to get JSON error message
            try {
                const errorData = await response.json();
                return { success: false, message: errorData.message || 'Request failed' };
            } catch (e) {
                // If response is not JSON, return generic error
                return { 
                    success: false, 
                    message: `Request failed with status: ${response.status}`
                };
            }
        }
    } catch (error) {
        console.error('Error:', error);
        return { 
            success: false, 
            message: error.message || 'Network error occurred'
        };
    }


}


export const editData = async (url, updatedData) => {
    try {
        const response = await axios.put(
            `${process.env.REACT_APP_BASE_URL}${url}`,
            updatedData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Edit data error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || error.message || 'Failed to update profile');
    }
}

export const deleteData = async (url ) => {
    const { res } = await axios.delete(`${process.env.REACT_APP_BASE_URL}${url}`,params)
    return res;
}


export const deleteImages = async (url,image ) => {
    const { res } = await axios.delete(`${process.env.REACT_APP_BASE_URL}${url}`,image);
    return res;
}


// Resend OTP
export const resendOtp = async (url) => {
    try {
        const token = localStorage.getItem("token");

        const { data } = await axios.post(process.env.REACT_APP_BASE_URL + url, {}, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            // withCredentials: true
        });

        return data;
    } catch (error) {
        console.error("Error in resendOtp:", error.response?.data || error.message);
        throw error;
    }
};