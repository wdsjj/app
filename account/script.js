new Vue({
    el: '#app',
    data: {
        currentTab: 'home',
        tabs: [
            { id: 'home', name: '首页', icon: 'fa-solid fa-home' },
            { id: 'records', name: '记录', icon: 'fa-solid fa-list' },
            { id: 'stats', name: '统计', icon: 'fa-solid fa-chart-pie' },
            { id: 'budget', name: '预算', icon: 'fa-solid fa-wallet' },
            { id: 'settings', name: '设置', icon: 'fa-solid fa-gear' }
        ],
        transactions: [],
        budgets: [],
        currentFilter: 'all',
        filters: [
            { id: 'all', name: '全部' },
            { id: 'income', name: '收入' },
            { id: 'expense', name: '支出' },
            { id: 'transfer', name: '转账' }
        ],
        selectedMonth: '',
        showAddModal: false,
        showBudgetModal: false,
        currentTransactionType: 'expense',
        editingTransaction: null,
        editingBudget: null,
        transactionForm: {
            amount: '',
            category: '',
            date: '',
            note: ''
        },
        budgetForm: {
            category: '',
            limit: ''
        },
        incomeCategories: ['工资', '奖金', '投资', '兼职', '红包', '退款', '其他收入'],
        expenseCategories: ['餐饮', '交通', '购物', '娱乐', '医疗', '教育', '住房', '水电', '通讯', '其他支出'],
        transferCategories: ['银行卡', '支付宝', '微信', '现金', '其他账户'],
        settings: {
            currency: 'CNY',
            reminder: false,
            reminderTime: '20:00'
        }
    },
    computed: {
        filteredTransactions() {
            let filtered = this.transactions;

            if (this.currentFilter !== 'all') {
                filtered = filtered.filter(t => t.type === this.currentFilter);
            }

            if (this.selectedMonth) {
                filtered = filtered.filter(t => {
                    const transactionDate = new Date(t.date);
                    const monthStr = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
                    return monthStr === this.selectedMonth;
                });
            }

            return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        },
        recentTransactions() {
            return this.transactions
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 10);
        },
        totalIncome() {
            return this.transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
        },
        totalExpense() {
            return this.transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
        },
        totalBalance() {
            return this.totalIncome - this.totalExpense;
        },
        thisMonthIncome() {
            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            return this.transactions
                .filter(t => {
                    const transactionDate = new Date(t.date);
                    const monthStr = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
                    return monthStr === currentMonth && t.type === 'income';
                })
                .reduce((sum, t) => sum + t.amount, 0);
        },
        thisMonthExpense() {
            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            return this.transactions
                .filter(t => {
                    const transactionDate = new Date(t.date);
                    const monthStr = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
                    return monthStr === currentMonth && t.type === 'expense';
                })
                .reduce((sum, t) => sum + t.amount, 0);
        },
        categoryExpense() {
            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const categoryData = {};

            this.transactions
                .filter(t => {
                    const transactionDate = new Date(t.date);
                    const monthStr = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
                    return monthStr === currentMonth && t.type === 'expense';
                })
                .forEach(t => {
                    if (!categoryData[t.category]) {
                        categoryData[t.category] = { amount: 0, count: 0 };
                    }
                    categoryData[t.category].amount += t.amount;
                    categoryData[t.category].count += 1;
                });

            const totalExpense = Object.values(categoryData)
                .reduce((sum, data) => sum + data.amount, 0);

            Object.keys(categoryData).forEach(category => {
                categoryData[category].percentage = totalExpense > 0
                    ? (categoryData[category].amount / totalExpense) * 100
                    : 0;
            });

            return categoryData;
        },
        last6Months() {
            const months = [];
            const now = new Date();
            for (let i = 5; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                months.push(`${date.getMonth() + 1}月`);
            }
            return months;
        }
    },
    mounted() {
        this.loadData();
        this.initializeSelectedMonth();
    },
    methods: {
        loadData() {
            const savedTransactions = localStorage.getItem('accounting_transactions');
            const savedBudgets = localStorage.getItem('accounting_budgets');
            const savedSettings = localStorage.getItem('accounting_settings');

            if (savedTransactions) {
                this.transactions = JSON.parse(savedTransactions);
            } else {
                this.addSampleData();
            }

            if (savedBudgets) {
                this.budgets = JSON.parse(savedBudgets);
            }

            if (savedSettings) {
                this.settings = JSON.parse(savedSettings);
            }
        },
        saveTransactions() {
            localStorage.setItem('accounting_transactions', JSON.stringify(this.transactions));
        },
        saveBudgets() {
            localStorage.setItem('accounting_budgets', JSON.stringify(this.budgets));
        },
        saveSettings() {
            localStorage.setItem('accounting_settings', JSON.stringify(this.settings));
        },
        addSampleData() {
            const now = new Date();
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const twoDaysAgo = new Date(now);
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
            const threeDaysAgo = new Date(now);
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

            this.transactions = [
                {
                    id: 1,
                    type: 'income',
                    amount: 8000,
                    category: '工资',
                    date: yesterday.toISOString().split('T')[0],
                    note: '本月工资'
                },
                {
                    id: 2,
                    type: 'expense',
                    amount: 45,
                    category: '餐饮',
                    date: yesterday.toISOString().split('T')[0],
                    note: '午餐'
                },
                {
                    id: 3,
                    type: 'expense',
                    amount: 120,
                    category: '交通',
                    date: twoDaysAgo.toISOString().split('T')[0],
                    note: '滴滴打车'
                },
                {
                    id: 4,
                    type: 'expense',
                    amount: 299,
                    category: '购物',
                    date: threeDaysAgo.toISOString().split('T')[0],
                    note: '买衣服'
                },
                {
                    id: 5,
                    type: 'income',
                    amount: 500,
                    category: '奖金',
                    date: threeDaysAgo.toISOString().split('T')[0],
                    note: '项目奖金'
                }
            ];
            this.saveTransactions();

            this.budgets = [
                {
                    id: 1,
                    category: '餐饮',
                    limit: 2000,
                    spent: 45
                },
                {
                    id: 2,
                    category: '交通',
                    limit: 500,
                    spent: 120
                },
                {
                    id: 3,
                    category: '购物',
                    limit: 1000,
                    spent: 299
                }
            ];
            this.saveBudgets();
        },
        initializeSelectedMonth() {
            const now = new Date();
            this.selectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        },
        formatMoney(amount) {
            const currencySymbols = {
                'CNY': '¥',
                'USD': '$',
                'EUR': '€',
                'JPY': '¥'
            };
            const symbol = currencySymbols[this.settings.currency] || '¥';
            return `${symbol}${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
        },
        formatDate(dateStr) {
            const date = new Date(dateStr);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            const weekday = weekdays[date.getDay()];
            return `${month}月${day}日 ${weekday}`;
        },
        getCategoryIcon(category) {
            const icons = {
                '工资': 'fa-solid fa-money-bill-wave',
                '奖金': 'fa-solid fa-trophy',
                '投资': 'fa-solid fa-chart-line',
                '兼职': 'fa-solid fa-briefcase',
                '红包': 'fa-solid fa-gift',
                '退款': 'fa-solid fa-arrow-rotate-left',
                '其他收入': 'fa-solid fa-plus-circle',
                '餐饮': 'fa-solid fa-utensils',
                '交通': 'fa-solid fa-car',
                '购物': 'fa-solid fa-bag-shopping',
                '娱乐': 'fa-solid fa-gamepad',
                '医疗': 'fa-solid fa-hospital',
                '教育': 'fa-solid fa-book',
                '住房': 'fa-solid fa-house',
                '水电': 'fa-solid fa-bolt',
                '通讯': 'fa-solid fa-phone',
                '其他支出': 'fa-solid fa-minus-circle',
                '银行卡': 'fa-solid fa-credit-card',
                '支付宝': 'fa-solid fa-wallet',
                '微信': 'fa-brands fa-weixin',
                '现金': 'fa-solid fa-money-bill',
                '其他账户': 'fa-solid fa-exchange-alt'
            };
            return icons[category] || 'fa-solid fa-circle';
        },
        getCategories() {
            if (this.currentTransactionType === 'income') {
                return this.incomeCategories;
            } else if (this.currentTransactionType === 'expense') {
                return this.expenseCategories;
            } else {
                return this.transferCategories;
            }
        },
        openAddModal(type = 'expense') {
            this.currentTransactionType = type;
            this.editingTransaction = null;
            this.transactionForm = {
                amount: '',
                category: '',
                date: new Date().toISOString().split('T')[0],
                note: ''
            };
            this.showAddModal = true;
        },
        closeModal() {
            this.showAddModal = false;
            this.editingTransaction = null;
        },
        editTransaction(transaction) {
            this.editingTransaction = transaction;
            this.currentTransactionType = transaction.type;
            this.transactionForm = {
                amount: transaction.amount,
                category: transaction.category,
                date: transaction.date,
                note: transaction.note
            };
            this.showAddModal = true;
        },
        saveTransaction() {
            if (!this.transactionForm.amount || !this.transactionForm.category || !this.transactionForm.date) {
                alert('请填写完整信息！');
                return;
            }

            if (this.editingTransaction) {
                const index = this.transactions.findIndex(t => t.id === this.editingTransaction.id);
                if (index !== -1) {
                    this.transactions[index] = {
                        ...this.editingTransaction,
                        type: this.currentTransactionType,
                        amount: parseFloat(this.transactionForm.amount),
                        category: this.transactionForm.category,
                        date: this.transactionForm.date,
                        note: this.transactionForm.note
                    };
                }
            } else {
                const newTransaction = {
                    id: Date.now(),
                    type: this.currentTransactionType,
                    amount: parseFloat(this.transactionForm.amount),
                    category: this.transactionForm.category,
                    date: this.transactionForm.date,
                    note: this.transactionForm.note
                };
                this.transactions.push(newTransaction);
            }

            this.updateBudgetSpent();
            this.saveTransactions();
            this.closeModal();
        },
        deleteTransaction(transaction) {
            if (confirm('确定要删除这条记录吗？')) {
                this.transactions = this.transactions.filter(t => t.id !== transaction.id);
                this.updateBudgetSpent();
                this.saveTransactions();
            }
        },
        openBudgetModal() {
            this.editingBudget = null;
            this.budgetForm = {
                category: '',
                limit: ''
            };
            this.showBudgetModal = true;
        },
        closeBudgetModal() {
            this.showBudgetModal = false;
            this.editingBudget = null;
        },
        editBudget(budget) {
            this.editingBudget = budget;
            this.budgetForm = {
                category: budget.category,
                limit: budget.limit
            };
            this.showBudgetModal = true;
        },
        saveBudget() {
            if (!this.budgetForm.category || !this.budgetForm.limit) {
                alert('请填写完整信息！');
                return;
            }

            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const spent = this.transactions
                .filter(t => {
                    const transactionDate = new Date(t.date);
                    const monthStr = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
                    return monthStr === currentMonth && t.type === 'expense' && t.category === this.budgetForm.category;
                })
                .reduce((sum, t) => sum + t.amount, 0);

            if (this.editingBudget) {
                const index = this.budgets.findIndex(b => b.id === this.editingBudget.id);
                if (index !== -1) {
                    this.budgets[index] = {
                        ...this.editingBudget,
                        category: this.budgetForm.category,
                        limit: parseFloat(this.budgetForm.limit),
                        spent: spent
                    };
                }
            } else {
                const existingBudget = this.budgets.find(b => b.category === this.budgetForm.category);
                if (existingBudget) {
                    alert('该分类已设置预算！');
                    return;
                }

                const newBudget = {
                    id: Date.now(),
                    category: this.budgetForm.category,
                    limit: parseFloat(this.budgetForm.limit),
                    spent: spent
                };
                this.budgets.push(newBudget);
            }

            this.saveBudgets();
            this.closeBudgetModal();
        },
        updateBudgetSpent() {
            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

            this.budgets.forEach(budget => {
                budget.spent = this.transactions
                    .filter(t => {
                        const transactionDate = new Date(t.date);
                        const monthStr = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
                        return monthStr === currentMonth && t.type === 'expense' && t.category === budget.category;
                    })
                    .reduce((sum, t) => sum + t.amount, 0);
            });
            this.saveBudgets();
        },
        getBudgetPercentage(budget) {
            if (budget.limit <= 0) return 0;
            return Math.min((budget.spent / budget.limit) * 100, 100);
        },
        getBudgetStatusClass(budget) {
            const percentage = this.getBudgetPercentage(budget);
            if (percentage >= 100) return 'danger';
            if (percentage >= 80) return 'warning';
            return '';
        },
        getBarHeight(type, monthLabel) {
            const now = new Date();
            const monthIndex = this.last6Months.indexOf(monthLabel);
            const targetDate = new Date(now.getFullYear(), now.getMonth() - (5 - monthIndex), 1);
            const monthStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;

            const amount = this.transactions
                .filter(t => {
                    const transactionDate = new Date(t.date);
                    const transactionMonth = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
                    return transactionMonth === monthStr && t.type === type;
                })
                .reduce((sum, t) => sum + t.amount, 0);

            const maxAmount = Math.max(
                ...this.last6Months.map((_, i) => {
                    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
                    const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                    return this.transactions
                        .filter(t => {
                            const td = new Date(t.date);
                            const tm = `${td.getFullYear()}-${String(td.getMonth() + 1).padStart(2, '0')}`;
                            return tm === mStr && (t.type === 'income' || t.type === 'expense');
                        })
                        .reduce((sum, t) => sum + t.amount, 0);
                }),
                1
            );

            return (amount / maxAmount) * 100;
        },
        toggleReminder() {
            this.settings.reminder = !this.settings.reminder;
            this.saveSettings();
        },
        exportData() {
            const data = {
                transactions: this.transactions,
                budgets: this.budgets,
                settings: this.settings,
                exportDate: new Date().toISOString()
            };

            const dataStr = JSON.stringify(data, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `accounting-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        },
        resetData() {
            if (confirm('确定要重置所有数据吗？此操作不可恢复！')) {
                this.transactions = [];
                this.budgets = [];
                this.settings = {
                    currency: 'CNY',
                    reminder: false,
                    reminderTime: '20:00'
                };
                localStorage.removeItem('accounting_transactions');
                localStorage.removeItem('accounting_budgets');
                localStorage.removeItem('accounting_settings');
                this.addSampleData();
            }
        },
        filterByMonth() {
        }
    }
});
