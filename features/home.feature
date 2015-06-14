# tests/features/home.feature

Feature: Home page
  As any user
  I want to be able to visit the home page and see a title

  Scenario: Visiting home page
    Given I am an anonymous user
    When I go to the home page
    Then I should see "zakhenry.com" as the page title
    And I should see "I'm Zak Henry" as the main heading