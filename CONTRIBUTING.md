# Conference Data Contributing Guidelines

## Getting Started

1. [Fork](https://github.com/tech-conferences/conference-data/fork) the repository on GitHub.
2. Clone the forked repository to your local machine.

    ```sh
    git clone https://github.com/<your_github_username>/conference-data.git
    ```

3. Get into the root directory

    ```sh
    cd conference-data
    ```

4. Install all the dependencies

    ```sh
    npm install
    ```

5. Create your branch

    ```sh
    git checkout -b <your_branch_name>
    ```

6. Run the development server

    ```sh
    npm run dev
    ```

## Making Changes

1.  Make sure your code follows the style guidelines of this project.
2.  If you are adding a conference, ensure that you are following the **Conference data structure** mentioned below:

    ```json
    {
        "name": "",
        "url": "",
        "startDate": "YYYY-MM-DD",
        "endDate": "YYYY-MM-DD",
        "city": "",
        "country": "",
        "cfpUrl": "",
        "cfpEndDate": "",
        "twitter": "",
        "mastodon": "",
        "cocUrl": "",
        "locales": ""
    }
    ```

3.  Save your changes and run the tests.

    ```bash
    npm run test
    ```

4.  Write clear, concise commit messages. Linking the commit to an issue is also a good practice to follow.

    ```bash
    git commit -m "✨ Fixes #123: Added <ConferenceName> to the list"
    ```

5.  Push to the branch.

    ```bash
    git push origin <your_branch_name>
    ```

6.  Open a pull request.

## Code of Conduct

Please note that this project is released with a [Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.
