# Metropolitan Police Service stop and search data visualisation

## Mood board inspiration



## Choice of tools

### React framework - NextJS

A requirement of the task and my personal choice. Allows frontend and backend development in the same app and repo. Many performance optimisations including SSR.

### Object Notation - Typescript

Allows typesafe development; alternatives: ES6

### Data visualisation framework - D3

A long term personal preference allows deep flexibility in presenting data visually.

Alternatives

### Component Library, visual testing: Storybook


### Redux state management: MOBX State tree


## Data Breakdown

```json
    {
        "age_range": "18-24", 
        "officer_defined_ethnicity": null, 
        "involved_person": true, 
        "self_defined_ethnicity": "Other ethnic group - Not stated", 
        "gender": "Male", 
        "legislation": null, 
        "outcome_linked_to_object_of_search": null, 
        "datetime": "2024-01-06T22:45:00+00:00", 
        "outcome_object": {
            "id": "bu-no-further-action", 
            "name": "A no further action disposal"
        }, 
        "location": {
            "latitude": "52.628997", 
            "street": {
                "id": 1738518, 
                "name": "On or near Crescent Street"
            }, 
            "longitude": "-1.130273"
        }, 
        "object_of_search": "Controlled drugs", 
        "operation": null, 
        "outcome": "A no further action disposal", 
        "type": "Person and Vehicle search", 
        "operation_name": null, 
        "removal_of_more_than_outer_clothing": false
    },
```


## Design

Looking at the data I would like to create a tool that allows freeform exploration of the data. The data is naturaly sequenced chronolically and has multiple cross-sections to explore. Therefore in terms of information heirarchy; I'd thave the time-range in view at the top; along with controls to move in or out of the time-range as well as move side to side. Then each cross-section should be broken down as cells with appropriate visualisations. Clicking into these should futher focus the visualisation as a filter to the dataset.

### Data Heirarchy

![data-hierarchy](/public/readme/data-hierarchy.jpg)


## Implementation

## 1 Creation of main layout 

### broken down into components per cross-section
### Storybook stories for each compoenent

## 2 Function to extract entire data-set

## 3 Choose and refine visualisations per cross-section

### Data scoped title

### Date Range
![date-filter-refinement](/public/readme/date-filter-refinement.jpg)

### Number of searches
### Age range
### Ethnicity
### Gender
### Outcome
### Location
### Object of search
### Search Type
### Removal of more than outer clothing

## 4 Refinement of UI

