const memoryManagement = {
    checkMemoryUsage: () => {
        const used = process.memoryUsage();
        for (let key in used) {
            console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
        }
    },
    
    gcCollect: () => {
        if (global.gc) {
            global.gc();
        }
    },
    
    monitorMemory: (threshold = 0.8) => {
        setInterval(() => {
            const memoryUsage = process.memoryUsage();
            const heapUsed = memoryUsage.heapUsed / memoryUsage.heapTotal;
            
            if (heapUsed > threshold) {
                console.log('High memory usage detected, triggering garbage collection');
                if (global.gc) {
                    global.gc();
                }
            }
        }, 30000); // Check every 30 seconds
    }
};

module.exports = memoryManagement;
