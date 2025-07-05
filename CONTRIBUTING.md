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

## Adding Conferences

If you’re adding a conference to the dataset, please follow these strict guidelines:

### Event Type

-   Only technical conferences (developer-focused) with talks are allowed.
-   Exclude meetups, user groups, and events without talks.
-   Exclude webinars, hackathons, marketing events, roadshows, conventions without talks.

### Topics & Format

-   Must be developer/tech related (e.g., programming languages, frameworks, tools, Data/AI).
-   No conferences focused on medicine, semiconductors, optoelectronics, or nanostructures, fashion, or other non-tech topics.
-   Must feature at least 3–4 talks by different companies.

### URLs & Online Checks

-   Use clean, shortened URLs (no UTM/tracker parameters, no ad frames).
-   Link must point to a dedicated conference page, not a blog post or listing.
-   The website is live and has an accessible CFP page.

### Name, Dates & Location

-   Use a concise name, ideally without year or location.
-   Dates (startDate, endDate, cfpEndDate) must be valid and in YYYY-MM-DD format.
-   Location formatting:
    -   US cities: City, ST (e.g., San Francisco, CA)
    -   Other countries: City, Country
    -   Prefer a major nearby city over small suburbs.

### Why These Rules?

These guidelines help maintain quality, consistency, and reduce review burden—principles recommended in open-source contribution best practices.
Clearly documenting review criteria and stating explicit rules helps streamline PR triage and reduce disagreements ().

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
