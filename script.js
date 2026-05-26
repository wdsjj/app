new Vue({
    el: '#app',
    data: {
        currentTab: 'home',
        currentFilter: 'all',
        showAddModal: false,
        editingTask: null,
        userInfo: {
            name: '学习者',
            joinDate: '2024-01-01',
            goal: '每天学习一小时，提升自己！',
            dailyGoal: 60
        },
        tasks: [],
        achievements: [
            { id: 1, title: '初学者', icon: 'fa-solid fa-star', description: '完成第一个学习任务', unlocked: true, progress: 100 },
            { id: 2, title: '坚持者', icon: 'fa-solid fa-flame', description: '连续学习7天', unlocked: false, progress: 30 },
            { id: 3, title: '学霸', icon: 'fa-solid fa-trophy', description: '完成100个学习任务', unlocked: false, progress: 25 },
            { id: 4, title: '全能选手', icon: 'fa-solid fa-award', description: '完成所有科目各一个任务', unlocked: false, progress: 50 },
            { id: 5, title: '马拉松', icon: 'fa-solid fa-footprints', description: '学习总时长达到100小时', unlocked: false, progress: 40 },
            { id: 6, title: '月度之星', icon: 'fa-solid fa-calendar-check', description: '一个月内每天都学习', unlocked: false, progress: 0 }
        ],
        tabs: [
            { id: 'home', name: '主页', icon: 'fa-solid fa-home' },
            { id: 'planner', name: '计划表', icon: 'fa-solid fa-calendar' },
            { id: 'progress', name: '进度', icon: 'fa-solid fa-chart-line' },
            { id: 'achievements', name: '完成情况', icon: 'fa-solid fa-trophy' },
            { id: 'profile', name: '个人信息', icon: 'fa-solid fa-user' }
        ],
        filters: [
            { id: 'all', name: '全部' },
            { id: 'today', name: '今天' },
            { id: 'week', name: '本周' },
            { id: 'pending', name: '待完成' },
            { id: 'completed', name: '已完成' }
        ],
        priorities: [
            { value: 'high', label: '高' },
            { value: 'medium', label: '中' },
            { value: 'low', label: '低' }
        ],
        taskForm: {
            title: '',
            subject: '',
            date: '',
            duration: 30,
            priority: 'medium',
            description: ''
        }
    },
    computed: {
        todayTasks() {
            const today = this.getTodayString();
            return this.tasks.filter(t => t.date === today);
        },
        completedToday() {
            return this.todayTasks.filter(t => t.completed).length;
        },
        streakDays() {
            return this.calculateStreak();
        },
        overallProgress() {
            if (this.tasks.length === 0) return 0;
            const completed = this.tasks.filter(t => t.completed).length;
            return Math.round((completed / this.tasks.length) * 100);
        },
        recentTasks() {
            return [...this.tasks]
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5);
        },
        filteredTasks() {
            let filtered = [...this.tasks];
            
            switch (this.currentFilter) {
                case 'today':
                    filtered = filtered.filter(t => t.date === this.getTodayString());
                    break;
                case 'week':
                    filtered = filtered.filter(t => this.isThisWeek(t.date));
                    break;
                case 'pending':
                    filtered = filtered.filter(t => !t.completed);
                    break;
                case 'completed':
                    filtered = filtered.filter(t => t.completed);
                    break;
            }
            
            return filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
        },
        weeklyData() {
            const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
            const today = new Date();
            const weekData = [];
            
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                const dayName = days[date.getDay()] || days[0];
                
                const dayTasks = this.tasks.filter(t => t.date === dateStr && t.completed);
                const hours = dayTasks.reduce((sum, t) => sum + t.duration, 0) / 60;
                
                weekData.push({
                    name: dayName,
                    date: dateStr,
                    hours: Math.round(hours * 10) / 10
                });
            }
            
            const maxHours = Math.max(...weekData.map(d => d.hours), 1);
            weekData.forEach(d => {
                d.percentage = Math.round((d.hours / maxHours) * 100);
            });
            
            return weekData;
        },
        weeklyTotalHours() {
            return this.weeklyData.reduce((sum, d) => sum + d.hours, 0).toFixed(1);
        },
        subjectProgress() {
            const subjects = ['数学', '英语', '语文', '物理', '化学', '生物', '历史', '地理', '编程', '其他'];
            const colorMap = {
                '数学': 'math', '英语': 'english', '语文': 'chinese', '物理': 'physics',
                '化学': 'chemistry', '生物': 'biology', '历史': 'history', '地理': 'geography',
                '编程': 'programming', '其他': 'other'
            };
            
            return subjects.map(subject => {
                const subjectTasks = this.tasks.filter(t => t.subject === subject);
                const completed = subjectTasks.filter(t => t.completed).length;
                const total = subjectTasks.length;
                const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                
                return {
                    name: subject,
                    completed,
                    total,
                    percentage,
                    color: colorMap[subject] || 'other'
                };
            }).filter(s => s.total > 0);
        },
        milestones() {
            const totalCompleted = this.tasks.filter(t => t.completed).length;
            const totalHours = this.totalStudyHours;
            
            return [
                { id: 1, title: '初试牛刀', description: '完成第一个任务', current: totalCompleted, target: 1, achieved: totalCompleted >= 1 },
                { id: 2, title: '小有成就', description: '完成10个任务', current: totalCompleted, target: 10, achieved: totalCompleted >= 10 },
                { id: 3, title: '持之以恒', description: '连续学习7天', current: this.streakDays, target: 7, achieved: this.streakDays >= 7 },
                { id: 4, title: '知识渊博', description: '累计学习50小时', current: Math.floor(totalHours), target: 50, achieved: totalHours >= 50 }
            ];
        },
        achievedCount() {
            return this.achievements.filter(a => a.unlocked).length;
        },
        totalCompletedTasks() {
            return this.tasks.filter(t => t.completed).length;
        },
        totalStudyHours() {
            return this.tasks.filter(t => t.completed).reduce((sum, t) => sum + t.duration, 0) / 60;
        },
        calendarData() {
            const data = [];
            const today = new Date();
            
            for (let i = 364; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                const day = date.getDate();
                
                const tasks = this.tasks.filter(t => t.date === dateStr);
                const completed = tasks.filter(t => t.completed).length;
                
                data.push({
                    date: dateStr,
                    day,
                    count: completed
                });
            }
            
            return data;
        },
        totalTasks() {
            return this.tasks.length;
        },
        completedTasksPercent() {
            if (this.tasks.length === 0) return 0;
            return Math.round((this.totalCompletedTasks / this.tasks.length) * 100);
        }
    },
    mounted() {
        this.loadData();
        if (this.tasks.length === 0) {
            this.generateSampleData();
        }
    },
    methods: {
        getTodayString() {
            return new Date().toISOString().split('T')[0];
        },
        isThisWeek(dateStr) {
            const date = new Date(dateStr);
            const today = new Date();
            const dayOfWeek = today.getDay() || 7;
            const monday = new Date(today);
            monday.setDate(today.getDate() - dayOfWeek + 1);
            monday.setHours(0, 0, 0, 0);
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            sunday.setHours(23, 59, 59, 999);
            return date >= monday && date <= sunday;
        },
        calculateStreak() {
            let streak = 0;
            const today = new Date();
            
            for (let i = 0; i < 365; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                const hasCompleted = this.tasks.some(t => t.date === dateStr && t.completed);
                
                if (hasCompleted) {
                    streak++;
                } else if (i > 0) {
                    break;
                }
            }
            
            return streak;
        },
        formatDate(dateStr) {
            const date = new Date(dateStr);
            const month = date.getMonth() + 1;
            const day = date.getDate();
            return `${month}月${day}日`;
        },
        getPriorityLabel(priority) {
            const map = { high: '高', medium: '中', low: '低' };
            return map[priority] || priority;
        },
        getFilterLabel(filter) {
            const map = { all: '', today: '今天', week: '本周', pending: '待完成', completed: '已完成' };
            return map[filter] || '';
        },
        getDayClass(day) {
            if (day.count === 0) return 'none';
            if (day.count <= 2) return 'low';
            if (day.count <= 4) return 'medium';
            return 'high';
        },
        toggleTask(task) {
            if (task.original) return;
            task.completed = !task.completed;
            this.saveData();
            this.updateAchievements();
        },
        openAddModal() {
            this.editingTask = null;
            this.taskForm = {
                title: '',
                subject: '',
                date: this.getTodayString(),
                duration: 30,
                priority: 'medium',
                description: ''
            };
            this.showAddModal = true;
        },
        editTask(task) {
            this.editingTask = task;
            this.taskForm = {
                title: task.title,
                subject: task.subject,
                date: task.date,
                duration: task.duration,
                priority: task.priority,
                description: task.description
            };
            this.showAddModal = true;
        },
        deleteTask(task) {
            if (confirm('确定要删除这个任务吗？')) {
                this.tasks = this.tasks.filter(t => t.id !== task.id);
                this.saveData();
            }
        },
        closeModal() {
            this.showAddModal = false;
            this.editingTask = null;
        },
        saveTask() {
            if (!this.taskForm.title || !this.taskForm.subject || !this.taskForm.date) {
                alert('请填写必填项');
                return;
            }
            
            if (this.editingTask) {
                Object.assign(this.editingTask, this.taskForm);
            } else {
                this.tasks.push({
                    id: Date.now(),
                    ...this.taskForm,
                    completed: false,
                    createdAt: new Date().toISOString()
                });
            }
            
            this.closeModal();
            this.saveData();
        },
        updateAchievements() {
            const completed = this.tasks.filter(t => t.completed).length;
            const hours = this.totalStudyHours;
            const streak = this.streakDays;
            const subjects = [...new Set(this.tasks.filter(t => t.completed).map(t => t.subject))].length;
            
            this.achievements.forEach(a => {
                switch (a.id) {
                    case 1:
                        a.unlocked = completed >= 1;
                        a.progress = Math.min(100, completed * 100);
                        break;
                    case 2:
                        a.unlocked = streak >= 7;
                        a.progress = Math.min(100, Math.round((streak / 7) * 100));
                        break;
                    case 3:
                        a.unlocked = completed >= 100;
                        a.progress = Math.min(100, Math.round((completed / 100) * 100));
                        break;
                    case 4:
                        a.unlocked = subjects >= 10;
                        a.progress = Math.min(100, subjects * 10);
                        break;
                    case 5:
                        a.unlocked = hours >= 100;
                        a.progress = Math.min(100, Math.round((hours / 100) * 100));
                        break;
                }
            });
            
            this.saveData();
        },
        showHint() {
            const pending = this.tasks.filter(t => !t.completed);
            if (pending.length > 0) {
                const random = pending[Math.floor(Math.random() * pending.length)];
                alert(`提示：试试完成 "${random.title}"`);
            }
        },
        saveUserInfo() {
            this.saveData();
        },
        exportData() {
            const data = {
                userInfo: this.userInfo,
                tasks: this.tasks,
                achievements: this.achievements
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'study-planner-data.json';
            a.click();
            URL.revokeObjectURL(url);
        },
        resetData() {
            if (confirm('确定要重置所有数据吗？这将删除所有任务和设置！')) {
                localStorage.removeItem('studyPlanner');
                location.reload();
            }
        },
        saveData() {
            const data = {
                userInfo: this.userInfo,
                tasks: this.tasks,
                achievements: this.achievements
            };
            localStorage.setItem('studyPlanner', JSON.stringify(data));
        },
        loadData() {
            const saved = localStorage.getItem('studyPlanner');
            if (saved) {
                const data = JSON.parse(saved);
                this.userInfo = { ...this.userInfo, ...data.userInfo };
                this.tasks = data.tasks || [];
                this.achievements = data.achievements || this.achievements;
            }
        },
        generateSampleData() {
            const today = this.getTodayString();
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];
            
            const sampleTasks = [
                { id: 1, title: '复习数学公式', subject: '数学', date: today, duration: 45, priority: 'high', description: '复习三角函数和导数公式', completed: false },
                { id: 2, title: '背英语单词', subject: '英语', date: today, duration: 30, priority: 'medium', description: '背诵30个新单词', completed: true },
                { id: 3, title: '阅读语文课文', subject: '语文', date: today, duration: 40, priority: 'low', description: '阅读并理解课文内容', completed: false },
                { id: 4, title: '物理实验报告', subject: '物理', date: tomorrowStr, duration: 60, priority: 'high', description: '完成力学实验报告', completed: false },
                { id: 5, title: '编程练习', subject: '编程', date: tomorrowStr, duration: 90, priority: 'medium', description: '完成JavaScript基础练习', completed: false },
                { id: 6, title: '历史知识点整理', subject: '历史', date: today, duration: 35, priority: 'medium', description: '整理中国近代史知识点', completed: true },
                { id: 7, title: '化学方程式', subject: '化学', date: tomorrowStr, duration: 40, priority: 'high', description: '复习有机化学方程式', completed: false },
                { id: 8, title: '地理地图分析', subject: '地理', date: today, duration: 30, priority: 'low', description: '分析气候分布图', completed: true }
            ];
            
            this.tasks = sampleTasks;
            this.saveData();
        }
    }
});