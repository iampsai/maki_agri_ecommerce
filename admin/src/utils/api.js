import axios from "axios";

// api helpers used by admin pages

export const fetchDataFromApi = async (url) => {
    try {
        // Always get the latest token
        const currentToken = localStorage.getItem("token");
        const headers = {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json'
        };
        
    const baseUrl = process.env.REACT_APP_BASE_URL || 'http://localhost:8080';
        
    // For debugging purposes - show what URL is being called
    console.log(`API Request to: ${baseUrl + url}`);
        
        // Make the request
        const { data } = await axios.get(baseUrl + url, { headers })
        
        // For reports endpoints, ensure proper response format
        if (url.includes('/api/reports/')) {
            // If data is already in the correct format with success property
            if (data.hasOwnProperty('success')) {
                return data;
            }
            // Otherwise wrap the response in the success format
            return {
                success: true,
                data: data
            };
        }
        
    console.log(`API Response for ${url}:`, data && (typeof data === 'object' ? JSON.stringify(data).slice(0,200) : data));
    return data;
    } catch (error) {
    console.error(`API Error for ${url}:`, error.response?.data || error.message || error);
        
        // For reports endpoints, always return mock data structure on error
        if (url.includes('/api/reports/')) {
            return {
                success: false,
                message: error.message || 'Failed to load data'
            };
        }
        
    return error.response?.data || [];
    }
}


export const uploadImage = async (url, formData) => {
    const baseUrl = process.env.REACT_APP_BASE_URL || 'http://localhost:8080';
    const { res } = await axios.post(baseUrl + url , formData)
    return res;
}

export const postData = async (url, formData) => {
    try {
        // Always get the latest token
        const currentToken = localStorage.getItem("token");
        
    const baseUrl = process.env.REACT_APP_BASE_URL || 'http://localhost:8080';
    const response = await fetch(baseUrl + url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            const errorData = await response.json();
            return errorData;
        }
    } catch (error) {
        console.error('Error in postData:', error);
        return {
            error: true,
            msg: error.message || "Failed to post data"
        };
    }
}


export const editData = async (url, updatedData) => {
    try {
        // Always get the latest token
        const currentToken = localStorage.getItem("token");
        
    const baseUrl = process.env.REACT_APP_BASE_URL || 'http://localhost:8080';
    const response = await axios.put(`${baseUrl}${url}`, updatedData, {
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json',
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error in editData:', error.response?.data || error.message);
        return {
            error: true,
            msg: error.response?.data?.msg || "Failed to update data"
        };
    }
}

export const deleteData = async (url) => {
    try {
        // Always get the latest token
        const currentToken = localStorage.getItem("token");
        const headers = {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json'
        };
        
    const baseUrl = process.env.REACT_APP_BASE_URL || 'http://localhost:8080';
    const response = await axios.delete(`${baseUrl}${url}`, { headers });
        return response.data;
    } catch (error) {
        console.error('Error in deleteData:', error.response?.data || error.message);
        return {
            error: true,
            msg: error.response?.data?.msg || "Failed to delete data"
        };
    }
}


export const deleteImages = async (url, image) => {
    try {
        // Always get the latest token
        const currentToken = localStorage.getItem("token");
        const headers = {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json'
        };
        
    const baseUrl = process.env.REACT_APP_BASE_URL || 'http://localhost:4000';
    const response = await axios.delete(`${baseUrl}${url}`, {
            headers,
            data: image
        });
        return response.data;
    } catch (error) {
        console.error('Error in deleteImages:', error.response?.data || error.message);
        return {
            error: true,
            msg: error.response?.data?.msg || "Failed to delete images"
        };
    }
}