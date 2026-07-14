@api
Feature: Authentication API
  As a client application
  I want to authenticate via the Platzi Fake Store API
  So that I can access protected resources with a valid token

  Background:
    Given the authentication API is available

  # ──────────────────────────────────────────────────────────────────
  # POST /auth/login
  # ──────────────────────────────────────────────────────────────────

  @smoke
  Scenario: Successful login with valid credentials
    When I log in with valid credentials
    Then the response status should be 201
    And the response body should contain an "access_token"
    And the response body should contain a "refresh_token"

  @regression
  Scenario: Login fails with invalid password
    When I log in with an invalid password
    Then the response status should be 401

  @regression
  Scenario: Login fails with non-existent email
    When I log in with a non-existent email
    Then the response status should be 401

  @regression
  Scenario: Login fails when email is empty
    When I log in with an empty email
    Then the response status should be 401

  # ──────────────────────────────────────────────────────────────────
  # GET /auth/profile
  # ──────────────────────────────────────────────────────────────────

  @smoke
  Scenario: Fetch profile with a valid access token
    Given I am logged in with valid credentials
    When I request my profile
    Then the response status should be 200
    And the response body should contain an "id"
    And the response body should contain an "email"
    And the response body should contain a "role"

  @regression
  Scenario: Fetch profile without an access token
    When I request my profile without a token
    Then the response status should be 401

  @regression
  Scenario: Fetch profile with an invalid access token
    When I request my profile with an invalid access token
    Then the response status should be 401

  # ──────────────────────────────────────────────────────────────────
  # POST /auth/refresh-token
  # ──────────────────────────────────────────────────────────────────

  @smoke
  Scenario: Refresh access token with a valid refresh token
    Given I am logged in with valid credentials
    When I refresh my access token
    Then the response status should be 201
    And the response body should contain an "access_token"
    And the response body should contain a "refresh_token"

  @regression
  Scenario: Refresh token fails with an invalid refresh token
    When I refresh my access token using an invalid refresh token
    Then the response status should be 401

  @regression
  Scenario: Refresh token fails when refresh token is missing
    When I refresh my access token using an empty refresh token
    Then the response status should be 400
