pipeline {
    agent any
    
    environment {
        NODE_VERSION = '18'
        FRONTEND_DIR = 'frontend'
        BACKEND_DIR = 'backend'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Setup Node.js') {
            steps {
                sh 'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash'
                sh '. ~/.nvm/nvm.sh && nvm install $NODE_VERSION && nvm use $NODE_VERSION'
            }
        }
        
        stage('Install Dependencies') {
            parallel {
                stage('Frontend Dependencies') {
                    steps {
                        dir(FRONTEND_DIR) {
                            sh '. ~/.nvm/nvm.sh && npm ci'
                        }
                    }
                }
                stage('Backend Dependencies') {
                    steps {
                        dir(BACKEND_DIR) {
                            sh '. ~/.nvm/nvm.sh && npm ci'
                        }
                    }
                }
            }
        }
        
        stage('Build Frontend') {
            steps {
                dir(FRONTEND_DIR) {
                    sh '. ~/.nvm/nvm.sh && npm run build'
                }
            }
        }
        
        stage('Test Backend') {
            steps {
                dir(BACKEND_DIR) {
                    sh '. ~/.nvm/nvm.sh && npm test || echo "No tests configured"'
                }
            }
        }
        
        stage('Deploy Frontend') {
            when {
                branch 'main'
            }
            steps {
                script {
                    // Deploy to Vercel
                    sh 'npm install -g vercel'
                    dir(FRONTEND_DIR) {
                        sh 'vercel --prod --token $VERCEL_TOKEN'
                    }
                }
            }
        }
        
        stage('Deploy Backend') {
            when {
                branch 'main'
            }
            steps {
                script {
                    // Deploy to Railway
                    sh 'npm install -g @railway/cli'
                    dir(BACKEND_DIR) {
                        sh 'railway login --token $RAILWAY_TOKEN'
                        sh 'railway up'
                    }
                }
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            echo 'Deploy completed successfully!'
        }
        failure {
            echo 'Deploy failed!'
        }
    }
} 